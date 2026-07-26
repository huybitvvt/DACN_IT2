UPDATE "Submission" AS submission
SET
  "errorCategory" = CASE
    WHEN submission."status" = 'ERROR' THEN 'COMPILE_ERROR'
    WHEN submission."passedCount" > 0 THEN 'PARTIAL_SOLUTION'
    ELSE 'WRONG_OUTPUT'
  END,
  "errorFingerprint" = exercise."language"::text || ':' || CASE
    WHEN submission."status" = 'ERROR' THEN 'COMPILE_ERROR'
    WHEN submission."passedCount" > 0 THEN 'PARTIAL_SOLUTION'
    ELSE 'WRONG_OUTPUT'
  END,
  "errorSummary" = CASE
    WHEN submission."status" = 'ERROR' THEN 'Lỗi biên dịch'
    WHEN submission."passedCount" > 0 THEN 'Thuật toán chưa bao phủ hết'
    ELSE 'Kết quả sai'
  END
FROM "Exercise" AS exercise
WHERE
  submission."exerciseId" = exercise."id"
  AND submission."status" <> 'PASSED'
  AND submission."errorCategory" IS NULL;
