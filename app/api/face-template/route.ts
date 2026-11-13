import { type NextRequest, NextResponse } from "next/server";

import { resolveSelf } from "@/services/hris/attendanceServer";
import {
  decryptFaceTemplate,
  encryptFaceTemplate,
} from "@/services/hris/faceTemplate";
import { prisma } from "@/services/prisma";

const key = () => process.env.FACE_TEMPLATE_ENCRYPTION_KEY ?? "";

export async function GET(request: NextRequest) {
  const self = await resolveSelf(request);
  if (!self.ok) return self.response;

  if (!key()) {
    return NextResponse.json(
      { error: "FACE_TEMPLATE_ENCRYPTION_KEY belum diatur di server." },
      { status: 500 },
    );
  }

  const enrollment = await prisma.faceEnrollment.findUnique({
    where: { userDataId: self.userDataId },
    select: { template: true, consentAt: true },
  });
  if (!enrollment) return NextResponse.json(null);

  try {
    return NextResponse.json({
      template: decryptFaceTemplate(enrollment.template, key()),
      consentAt: enrollment.consentAt,
    });
  } catch {
    return NextResponse.json(
      { error: "Data wajah tidak bisa dibuka. Daftarkan ulang wajahmu." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const self = await resolveSelf(request);
  if (!self.ok) return self.response;

  if (!key()) {
    return NextResponse.json(
      { error: "FACE_TEMPLATE_ENCRYPTION_KEY belum diatur di server." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as {
    template?: unknown;
    consent?: unknown;
  };
  if (body.consent !== true) {
    return NextResponse.json(
      { error: "Persetujuan penggunaan data wajah wajib dicentang." },
      { status: 400 },
    );
  }
  if (
    !Array.isArray(body.template) ||
    body.template.length < 64 ||
    !body.template.every((value) => typeof value === "number" && Number.isFinite(value))
  ) {
    return NextResponse.json(
      { error: "Data wajah tidak terbaca. Coba ambil ulang foto." },
      { status: 400 },
    );
  }

  const template = encryptFaceTemplate(body.template as number[], key());
  const enrollment = await prisma.faceEnrollment.upsert({
    where: { userDataId: self.userDataId },
    create: {
      userDataId: self.userDataId,
      template,
      consentAt: new Date(),
    },
    update: { template, consentAt: new Date() },
    select: { consentAt: true },
  });

  return NextResponse.json({ enrolled: true, consentAt: enrollment.consentAt });
}

export async function DELETE(request: NextRequest) {
  const self = await resolveSelf(request);
  if (!self.ok) return self.response;

  await prisma.faceEnrollment.deleteMany({
    where: { userDataId: self.userDataId },
  });
  return NextResponse.json({ enrolled: false });
}
