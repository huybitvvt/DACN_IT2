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

async function main() {
  console.log('[seed] Bắt đầu nạp dữ liệu mẫu...');
  await clearContent();
  await seedBadges();
  await seedAdmin();
  await seedCourses();
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
