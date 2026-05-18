import {
  AssignmentStatus,
  CriterionLevel,
  PrismaClient,
  Role,
  UserStatus,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const unitScenarioMn = `Leshev Outfitters нь дэлгүүрийн тохижилтын үйлчилгээ үзүүлдэг компани юм.

Компани шинэ байр худалдан авсан бөгөөд одоогоор IT дэд бүтэц байхгүй. Та IT мэргэжилтний хувьд компанийн өдөр тутмын ажил, ажилтнуудын харилцаа, хэрэглэгчийн бүртгэл, захиалга, агуулахын нөөц болон ажлын хуваарийг дэмжих IT шийдэл төлөвлөнө.`

const assignmentInstructions = `Produce a structured report for Taylor Leshev explaining how an IT infrastructure can support the needs of Leshev Outfitters.

Your report should:

1. Examine suitable hardware, software, network and data communication components.
2. Explain how the proposed IT infrastructure supports staff, customers and business operations.
3. Compare alternative IT system components and justify your choices.
4. Evaluate the wider impact of the proposed IT system on individuals, the business and society.`

const assignmentInstructionsMn = `Taylor Leshev-д зориулж Leshev Outfitters компанийн хэрэгцээг хангах IT дэд бүтцийн талаар бүтэцтэй тайлан боловсруулна.

Тайланд дараах зүйлсийг тусгана:

1. Тохиромжтой техник хангамж, програм хангамж, сүлжээ болон өгөгдлийн холболтын бүрэлдэхүүн хэсгүүдийг судлах.
2. Санал болгож буй IT дэд бүтэц ажилтан, хэрэглэгч болон бизнесийн үйл ажиллагааг хэрхэн дэмжихийг тайлбарлах.
3. Өөр IT системийн бүрэлдэхүүнүүдийг харьцуулж сонголтоо үндэслэх.
4. Санал болгож буй IT систем хувь хүн, бизнес болон нийгэмд үзүүлэх нөлөөг үнэлэх.`

const criteria = [
  {
    id: 'seed-criterion-ap1',
    code: 'A.P1',
    level: CriterionLevel.PASS,
    title: 'Hardware and software components',
    titleMn: 'Техник болон програм хангамжийн бүрэлдэхүүн',
    description: 'Examine the hardware and software components of IT systems.',
    descriptionMn: 'IT системийн техник болон програм хангамжийн бүрэлдэхүүн хэсгүүдийг судлах.',
    commandVerb: 'Examine',
    maxScore: 20,
    sortOrder: 1,
  },
  {
    id: 'seed-criterion-ap2',
    code: 'A.P2',
    level: CriterionLevel.PASS,
    title: 'Data communication and networks',
    titleMn: 'Өгөгдлийн холболт болон сүлжээ',
    description: 'Explain how data communication and networking support the needs of an organisation.',
    descriptionMn: 'Өгөгдлийн холболт болон сүлжээ байгууллагын хэрэгцээг хэрхэн дэмжихийг тайлбарлах.',
    commandVerb: 'Explain',
    maxScore: 20,
    sortOrder: 2,
  },
  {
    id: 'seed-criterion-am1',
    code: 'A.M1',
    level: CriterionLevel.MERIT,
    title: 'Compare IT system components',
    titleMn: 'IT системийн бүрэлдэхүүнүүдийг харьцуулах',
    description: 'Compare the hardware and software components of different IT systems.',
    descriptionMn: 'Өөр өөр IT системийн техник болон програм хангамжийн бүрэлдэхүүнүүдийг харьцуулах.',
    commandVerb: 'Compare',
    maxScore: 30,
    sortOrder: 3,
  },
  {
    id: 'seed-criterion-ad1',
    code: 'A.D1',
    level: CriterionLevel.DISTINCTION,
    title: 'Evaluate impact',
    titleMn: 'Нөлөөг үнэлэх',
    description: 'Evaluate the impact of IT systems on individuals, organisations and society.',
    descriptionMn: 'IT систем хувь хүн, байгууллага болон нийгэмд үзүүлэх нөлөөг үнэлэх.',
    commandVerb: 'Evaluate',
    maxScore: 30,
    sortOrder: 4,
  },
]

function rubricSnapshot() {
  return {
    criteria: criteria.map((criterion) => ({
      id: criterion.id,
      code: criterion.code,
      description: criterion.description,
      descriptionMn: criterion.descriptionMn,
      maxScore: criterion.maxScore,
      grade: criterion.level,
    })),
  }
}

async function upsertUser(email: string, password: string, fullName: string, role: Role) {
  return prisma.user.upsert({
    where: { email },
    update: {
      password,
      fullName,
      role,
      status: UserStatus.ACTIVE,
      isActive: true,
    },
    create: {
      email,
      password,
      fullName,
      role,
      status: UserStatus.ACTIVE,
      isActive: true,
      emailVerifiedAt: new Date(),
    },
  })
}

async function main() {
  const adminPassword   = await bcrypt.hash('Admin@1234', 12)
  const leadIvPassword  = await bcrypt.hash('LeadIV@1234', 12)
  const ivPassword      = await bcrypt.hash('IV@1234', 12)
  const teacherPassword = await bcrypt.hash('Bd80102679@#$', 12)
  const studentPassword = await bcrypt.hash('Exe@1234', 12)

  const [admin, leadIv, iv, teacher, student] = await Promise.all([
    upsertUser('admin@btec.edu', adminPassword, 'System Admin', Role.ADMIN),
    upsertUser('leadiv@btec.edu', leadIvPassword, 'Lead Internal Verifier', Role.LEAD_IV),
    upsertUser('iv@btec.edu', ivPassword, 'Internal Verifier', Role.IV),
    upsertUser('dugersuren@gmail.com', teacherPassword, 'Dugersuren', Role.TEACHER),
    upsertUser('student@btec.edu', studentPassword, 'Demo Student', Role.STUDENT),
  ])

  const program = await prisma.program.upsert({
    where: { code: 'BTEC-IT-L3' },
    update: {},
    create: {
      id: 'seed-program-btec-it-l3',
      code: 'BTEC-IT-L3',
      name: 'Pearson BTEC International Level 3 Information Technology',
      nameMn: 'Pearson BTEC Олон улсын 3-р түвшин - Мэдээллийн технологи',
      level: 'Level 3',
    },
  })

  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2025-2026' },
    update: { isActive: true },
    create: {
      id: 'seed-academic-year-2025-2026',
      name: '2025-2026',
      startsAt: new Date('2025-09-01T00:00:00.000Z'),
      endsAt: new Date('2026-06-30T23:59:59.000Z'),
      isActive: true,
    },
  })

  const cohort = await prisma.cohort.upsert({
    where: { id: 'seed-cohort-it-2025' },
    update: {
      programId: program.id,
      academicYearId: academicYear.id,
    },
    create: {
      id: 'seed-cohort-it-2025',
      name: 'IT 2025 Cohort',
      programId: program.id,
      academicYearId: academicYear.id,
    },
  })

  await prisma.cohortMembership.upsert({
    where: {
      cohortId_studentId: {
        cohortId: cohort.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      cohortId: cohort.id,
      studentId: student.id,
    },
  })

  const unit = await prisma.unit.upsert({
    where: { id: 'seed-unit-1-it-systems' },
    update: {
      programId: program.id,
      createdById: leadIv.id,
    },
    create: {
      id: 'seed-unit-1-it-systems',
      programId: program.id,
      code: 'Unit 1',
      title: 'Information Technology Systems',
      titleMn: 'Мэдээллийн технологийн системүүд',
      description: 'Learners explore the relationships between IT systems, organisations and users.',
      descriptionMn: 'Суралцагчид IT систем, байгууллага болон хэрэглэгчдийн хоорондын хамаарлыг судална.',
      guidedLearningHours: 90,
      credits: 10,
      createdById: leadIv.id,
    },
  })

  const learningAim = await prisma.learningAim.upsert({
    where: { id: 'seed-learning-aim-a' },
    update: { unitId: unit.id },
    create: {
      id: 'seed-learning-aim-a',
      unitId: unit.id,
      code: 'A',
      title: 'Understand IT systems',
      titleMn: 'IT системийг ойлгох',
      description: 'Investigate how IT systems meet organisational needs.',
      descriptionMn: 'IT систем байгууллагын хэрэгцээг хэрхэн хангаж байгааг судлах.',
      sortOrder: 1,
    },
  })

  for (const criterion of criteria) {
    const { id, ...criterionData } = criterion
    await prisma.assessmentCriterion.upsert({
      where: { id },
      update: {
        unitId: unit.id,
        learningAimId: learningAim.id,
        ...criterionData,
      },
      create: {
        id,
        ...criterionData,
        unitId: unit.id,
        learningAimId: learningAim.id,
      },
    })
  }

  const assignment = await prisma.assignment.upsert({
    where: { id: 'seed-assignment-1' },
    update: {
      unitId: unit.id,
      cohortId: cohort.id,
      academicYearId: academicYear.id,
      title: 'Unit 1: Activity 01 - IT Infrastructure Proposal',
      titleMn: 'Unit 1: Үйл ажиллагаа 01 - IT дэд бүтцийн санал',
      scenario: 'Leshev Outfitters needs a practical IT infrastructure proposal for its new premises.',
      scenarioMn: unitScenarioMn,
      instructions: assignmentInstructions,
      instructionsMn: assignmentInstructionsMn,
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: AssignmentStatus.PUBLISHED,
      rubricSnapshot: rubricSnapshot(),
      ownerTeacherId: teacher.id,
      tasks: {
        deleteMany: {},
        create: [
          {
            title: 'Activity 1 report',
            titleMn: 'Үйл ажиллагаа 1 тайлан',
            instructions: assignmentInstructions,
            instructionsMn: assignmentInstructionsMn,
            criterionCodes: criteria.map((criterion) => criterion.code),
            sortOrder: 1,
            estimatedHours: 6,
          },
        ],
      },
      criteria: {
        deleteMany: {},
        create: criteria.map((criterion) => ({
          sourceCriterionId: criterion.id,
          code: criterion.code,
          level: criterion.level,
          title: criterion.title,
          titleMn: criterion.titleMn,
          description: criterion.description,
          descriptionMn: criterion.descriptionMn,
          maxScore: criterion.maxScore,
          passThreshold: 70,
          sortOrder: criterion.sortOrder,
        })),
      },
    },
    create: {
      id: 'seed-assignment-1',
      unitId: unit.id,
      cohortId: cohort.id,
      academicYearId: academicYear.id,
      title: 'Unit 1: Activity 01 - IT Infrastructure Proposal',
      titleMn: 'Unit 1: Үйл ажиллагаа 01 - IT дэд бүтцийн санал',
      scenario: 'Leshev Outfitters needs a practical IT infrastructure proposal for its new premises.',
      scenarioMn: unitScenarioMn,
      instructions: assignmentInstructions,
      instructionsMn: assignmentInstructionsMn,
      issueDate: new Date(),
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: AssignmentStatus.PUBLISHED,
      rubricSnapshot: rubricSnapshot(),
      createdById: teacher.id,
      ownerTeacherId: teacher.id,
      tasks: {
        create: [
          {
            title: 'Activity 1 report',
            titleMn: 'Үйл ажиллагаа 1 тайлан',
            instructions: assignmentInstructions,
            instructionsMn: assignmentInstructionsMn,
            criterionCodes: criteria.map((criterion) => criterion.code),
            sortOrder: 1,
            estimatedHours: 6,
          },
        ],
      },
      criteria: {
        create: criteria.map((criterion) => ({
          sourceCriterionId: criterion.id,
          code: criterion.code,
          level: criterion.level,
          title: criterion.title,
          titleMn: criterion.titleMn,
          description: criterion.description,
          descriptionMn: criterion.descriptionMn,
          maxScore: criterion.maxScore,
          passThreshold: 70,
          sortOrder: criterion.sortOrder,
        })),
      },
    },
  })

  await prisma.assignmentVerifier.upsert({
    where: {
      assignmentId_verifierId: {
        assignmentId: assignment.id,
        verifierId: iv.id,
      },
    },
    update: {
      isActive: true,
      assignedById: leadIv.id,
    },
    create: {
      assignmentId: assignment.id,
      verifierId: iv.id,
      assignedById: leadIv.id,
    },
  })

  console.log('Seed completed:', {
    admin: admin.email,
    leadIv: leadIv.email,
    iv: iv.email,
    teacher: teacher.email,
    student: student.email,
    assignment: assignment.title,
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
