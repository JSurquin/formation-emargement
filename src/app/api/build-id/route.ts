import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let buildId: string;

    if (process.env.NODE_ENV === "production") {
      const buildIdPath = path.join(process.cwd(), ".next", "BUILD_ID");
      buildId = fs.existsSync(buildIdPath)
        ? fs.readFileSync(buildIdPath, "utf-8").trim()
        : process.env.BUILD_ID || Date.now().toString();
    } else {
      buildId = process.env.BUILD_ID || "dev-" + Date.now();
    }

    return NextResponse.json(
      { buildId },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("Error reading BUILD_ID:", error);
    return NextResponse.json({ buildId: "unknown" }, { status: 500 });
  }
}
