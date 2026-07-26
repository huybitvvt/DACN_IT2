import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { badges, courses } from './seedData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@lpp.local';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin12345';

async function clearContent() {
  // Xoá theo thứ tự phụ thuộc (con trước cha). Quan hệ có onDelete: Cascade nên
  // chỉ cần xoá Course là kéo theo lesson/example/exercise/testcase/quiz...
  await prisma.contest.deleteMany();
  await prisma.course.deleteMany();
  await prisma.badge.deleteMany();
}

async function seedBadges() {
  for (const b of badges) {
    await prisma.badge.create({ data: b });
  }
  console.log(`[seed] Đã tạo ${badges.length} huy hiệu.`);
}

async function seedAdmin() {
  const passwordHash = await argon2.hash(ADMIN_PASSWORD, { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: 'ADMIN', passwordHash },
    create: {
      email: ADMIN_EMAIL,
      displayName: 'Quản trị viên',
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`[seed] Tài khoản admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

async function seedCourses() {
  for (const c of courses) {
    const course = await prisma.course.create({
      data: {
        slug: c.slug,
        title: c.title,
        language: c.language,
        description: c.description,
        order: c.order,
      },
    });

    let lessonOrder = 0;
    for (const l of c.lessons) {
      const lesson = await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: l.title,
          contentMarkdown: l.contentMarkdown,
          order: lessonOrder++,
          examples: {
            create: l.examples.map((ex, i) => ({
              language: ex.language,
              code: ex.code,
              order: i,
            })),
          },
        },
      });

      // Bài tập + test case
      let exOrder = 0;
      for (const ex of l.exercises) {
        await prisma.exercise.create({
          data: {
            lessonId: lesson.id,
            title: ex.title,
            promptMarkdown: ex.promptMarkdown,
            language: ex.language,
            starterCode: ex.starterCode,
            order: exOrder++,
            testCases: {
              create: ex.testCases.map((tc, i) => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                isHidden: tc.isHidden,
                order: i,
              })),
            },
          },
        });
      }

      // Quiz (nếu có câu hỏi)
      if (l.questions.length > 0) {
        await prisma.quiz.create({
          data: {
            lessonId: lesson.id,
            title: `Quiz: ${l.title}`,
            questions: {
              create: l.questions.map((q, qi) => ({
                text: q.text,
                type: q.type,
                order: qi,
                choices: {
                  create: q.choices.map((ch, ci) => ({
                    text: ch.text,
                    isCorrect: ch.isCorrect,
                    order: ci,
                  })),
                },
              })),
            },
          },
        });
      }
    }
    console.log(`[seed] Khoá "${c.title}": ${c.lessons.length} bài học.`);
  }
}

async function seedContests() {
  const now = new Date();
  const startsAt = new Date(now);
  startsAt.setDate(startsAt.getDate() - 7);
  const endsAt = new Date(now);
  endsAt.setDate(endsAt.getDate() + 21);

  const contest = await prisma.contest.upsert({
    where: { slug: 'codelearn-sprint-1' },
    update: {
      title: 'CodeLearn Sprint 1',
      description:
        'Mùa thi đua 4 tuần dành cho học viên mới: hoàn thành bài học, pass bài tập, làm quiz và duy trì streak để leo bảng xếp hạng.',
      status: 'ACTIVE',
      courseSlug: null,
      startsAt,
      endsAt,
      durationMinutes: 45,
      scoringNote:
        'Điểm = bài học/bài tập/quiz hoàn thành + submission pass + điểm quiz + điểm phòng thi + streak + huy hiệu. Bảng xếp hạng chốt khi mùa thi kết thúc.',
    },
    create: {
      slug: 'codelearn-sprint-1',
      title: 'CodeLearn Sprint 1',
      description:
        'Mùa thi đua 4 tuần dành cho học viên mới: hoàn thành bài học, pass bài tập, làm quiz và duy trì streak để leo bảng xếp hạng.',
      status: 'ACTIVE',
      startsAt,
      endsAt,
      durationMinutes: 45,
      scoringNote:
        'Điểm = bài học/bài tập/quiz hoàn thành + submission pass + điểm quiz + điểm phòng thi + streak + huy hiệu. Bảng xếp hạng chốt khi mùa thi kết thúc.',
    },
  });

  await prisma.contestReward.deleteMany({ where: { contestId: contest.id } });
  await prisma.contestReward.createMany({
    data: [
      {
        contestId: contest.id,
        rankFrom: 1,
        rankTo: 1,
        title: 'Hoàn 50% học phí',
        description: 'Top 1 được hoàn 50% học phí khoá đang học hoặc quy đổi thành voucher khoá tiếp theo.',
        rewardType: 'TUITION_REFUND',
        percentOff: 50,
      },
      {
        contestId: contest.id,
        rankFrom: 2,
        rankTo: 3,
        title: 'Voucher 30%',
        description: 'Top 2-3 nhận voucher 30% cho khoá học tiếp theo.',
        rewardType: 'VOUCHER',
        percentOff: 30,
      },
      {
        contestId: contest.id,
        rankFrom: 4,
        rankTo: 10,
        title: 'Huy hiệu Sprint Finisher',
        description: 'Top 4-10 nhận huy hiệu đặc biệt và quyền mở nhóm bài nâng cao.',
        rewardType: 'BADGE',
      },
    ],
  });

  const [exercise, quiz] = await Promise.all([
    prisma.exercise.findFirst({ orderBy: { order: 'asc' }, select: { id: true, title: true } }),
    prisma.quiz.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true, title: true } }),
  ]);
  await prisma.contestProblem.deleteMany({ where: { contestId: contest.id } });
  const problems = [];
  if (exercise) {
    problems.push({
      contestId: contest.id,
      problemType: 'EXERCISE' as const,
      exerciseId: exercise.id,
      title: exercise.title,
      points: 100,
      order: 0,
    });
  }
  if (quiz) {
    problems.push({
      contestId: contest.id,
      problemType: 'QUIZ' as const,
      quizId: quiz.id,
      title: quiz.title,
      points: 60,
      order: 1,
    });
  }
  if (problems.length > 0) {
    await prisma.contestProblem.createMany({ data: problems });
  }
  console.log('[seed] Đã tạo kỳ thi đua CodeLearn Sprint 1.');
}

async function seedRetentionDemoLearners(resetActivity = false) {
  const passwordHash = await argon2.hash('hocvien123', { type: argon2.argon2id });
  const now = new Date();
  const demoUsers = [
    {
      email: 'roi.nhip@lpp.local',
      displayName: 'Minh Rơi Nhịp',
      courseSlug: 'python',
      streakCount: 0,
      lastActiveOffsetDays: 10,
      completedItems: 0,
      paymentCode: 'CLDEMOAT',
    },
    {
      email: 'can.theo.doi@lpp.local',
      displayName: 'An Cần Theo Dõi',
      courseSlug: 'sql',
      streakCount: 4,
      lastActiveOffsetDays: 2,
      completedItems: 3,
      paymentCode: 'CLDEMOWATCH',
    },
    {
      email: 'giu.nhip@lpp.local',
      displayName: 'Linh Giữ Nhịp',
      courseSlug: 'python',
      streakCount: 9,
      lastActiveOffsetDays: 0,
      completedItems: 20,
      paymentCode: 'CLDEMOOK',
    },
  ];

  for (const demo of demoUsers) {
    const lastActiveDate = new Date(now);
    lastActiveDate.setDate(lastActiveDate.getDate() - demo.lastActiveOffsetDays);

    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: {
        displayName: demo.displayName,
        passwordHash,
        role: 'LEARNER',
        streakCount: demo.streakCount,
        lastActiveDate,
      },
      create: {
        email: demo.email,
        displayName: demo.displayName,
        passwordHash,
        role: 'LEARNER',
        streakCount: demo.streakCount,
        lastActiveDate,
      },
    });

    if (resetActivity) {
      await prisma.$transaction([
        prisma.progress.deleteMany({ where: { userId: user.id } }),
        prisma.submission.deleteMany({ where: { userId: user.id } }),
        prisma.quizAttempt.deleteMany({ where: { userId: user.id } }),
        prisma.userBadge.deleteMany({ where: { userId: user.id } }),
        prisma.learningIntervention.deleteMany({ where: { userId: user.id } }),
        prisma.notification.deleteMany({ where: { userId: user.id } }),
      ]);
    }

    const course = await prisma.course.findUnique({
      where: { slug: demo.courseSlug },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          include: {
            exercises: { orderBy: { order: 'asc' } },
            quiz: { select: { id: true } },
          },
        },
      },
    });
    if (!course) continue;

    await prisma.coursePurchase.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      update: {
        status: 'PAID',
        paidAt: now,
        paymentCode: demo.paymentCode,
        amountVnd: course.priceVnd,
      },
      create: {
        userId: user.id,
        courseId: course.id,
        status: 'PAID',
        paidAt: now,
        paymentCode: demo.paymentCode,
        amountVnd: course.priceVnd,
      },
    });

    const items = course.lessons.flatMap((lesson) => [
      { type: 'LESSON' as const, id: lesson.id },
      ...lesson.exercises.map((exercise) => ({ type: 'EXERCISE' as const, id: exercise.id })),
      ...(lesson.quiz ? [{ type: 'QUIZ' as const, id: lesson.quiz.id }] : []),
    ]);

    for (const item of items.slice(0, demo.completedItems)) {
      await prisma.progress.upsert({
        where: {
          userId_itemType_itemId: {
            userId: user.id,
            itemType: item.type,
            itemId: item.id,
          },
        },
        update: { completed: true, completedAt: lastActiveDate, courseId: course.id },
        create: {
          userId: user.id,
          courseId: course.id,
          itemType: item.type,
          itemId: item.id,
          completed: true,
          completedAt: lastActiveDate,
        },
      });
    }
  }

  console.log('[seed] Đã tạo học viên demo cho Trạm giữ nhịp/Can thiệp sớm.');
}

async function main() {
  console.log('[seed] Bắt đầu nạp dữ liệu mẫu...');

  // An toàn khi deploy: nếu đã có dữ liệu thì bỏ qua, tránh xoá tiến độ người dùng
  // ở các lần deploy lại. Đặt SEED_FORCE=true để buộc nạp lại từ đầu.
  const force = process.env.SEED_FORCE === 'true';
  const syncDemos = process.env.SEED_SYNC_DEMOS === 'true';
  const syncContests = process.env.SEED_SYNC_CONTESTS === 'true';
  const existing = await prisma.course.count();
  if (existing > 0 && !force) {
    console.log(`[seed] Đã có ${existing} khoá học -> bỏ qua seed (đặt SEED_FORCE=true để nạp lại).`);
    if (syncContests) {
      await seedContests();
      console.log('[seed] Đã đồng bộ mùa thi mẫu theo SEED_SYNC_CONTESTS=true.');
    }
    if (syncDemos) {
      await seedRetentionDemoLearners(true);
      console.log('[seed] Đã đồng bộ dữ liệu demo theo SEED_SYNC_DEMOS=true.');
    }
    // Vẫn đảm bảo có embedding cho bài học chưa có (an toàn, không xoá gì).
    try {
      const { backfillLessonEmbeddings } = await import('../src/modules/ai/embedding.service.js');
      const n = await backfillLessonEmbeddings();
      if (n > 0) console.log(`[seed] Đã bổ sung embedding cho ${n} bài học.`);
    } catch {
      /* bỏ qua */
    }
    return;
  }

  await clearContent();
  await seedBadges();
  await seedAdmin();
  await seedCourses();
  await seedContests();
  await seedRetentionDemoLearners();
  console.log('[seed] Đang tạo embeddings cho bài học (RAG ngữ nghĩa)...');
  try {
    const { backfillLessonEmbeddings } = await import('../src/modules/ai/embedding.service.js');
    const n = await backfillLessonEmbeddings();
    console.log(`[seed] Đã tạo embedding cho ${n} bài học.`);
  } catch (e) {
    console.warn('[seed] Bỏ qua tạo embedding (sẽ tự tạo khi chạy server):', e);
  }
  console.log('[seed] Hoàn tất.');
}

main()
  .catch((e) => {
    console.error('[seed] Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
