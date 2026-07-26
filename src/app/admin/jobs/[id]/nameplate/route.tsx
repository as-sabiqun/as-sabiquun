import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { createClient, getProfile } from "@/lib/supabase/server";
import { countryNameToIso2, flagUrl } from "@/lib/nameplate/country-codes";

// Auto-generates the branded nameplate graphic for a completed job, matching
// the reference templates in zTemplates/ (donor flag, As-Sabiqun seal,
// beneficiary flag, service title, participant name(s), package/location
// details, and — for water projects — a canned du'a block).

const TEAL = "#1d737f";
const TEAL_DARK = "#154f54";
const INK = "#31231b";
const CREAM = "#f7f4ec";

const WATER_DUA_AR =
  "اللَّهُمَّ اجْعَلْ هَذَا الْبِئْرَ نَافِعًا مُبَارَكًا دَائِمًا، وَارْزُقْنَا بِهِ الْأَجْرَ وَجَزَاءً خَيْرًا كَثِيرًا";
const WATER_DUA_EN = "May this water project benefit the community for years to come, inshaa Allah.";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();
}

function packageLabel(title: string, quantity: number): string {
  const short = title.replace(/^Korban\s*—\s*/i, "").replace(/^Wakaf\s*/i, "").trim();
  return quantity > 1 ? `(${short.toUpperCase()} × ${quantity})` : `(${short.toUpperCase()})`;
}

let fontCache: { schibstedBold: ArrayBuffer; schibstedBlack: ArrayBuffer; notoNaskh: ArrayBuffer } | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;
  const dir = join(process.cwd(), "assets", "fonts");
  const [schibstedBold, schibstedBlack, notoNaskh] = await Promise.all([
    readFile(join(dir, "SchibstedGrotesk-Bold.woff")),
    readFile(join(dir, "SchibstedGrotesk-Black.woff")),
    readFile(join(dir, "NotoNaskhArabic-Bold.woff")),
  ]);
  fontCache = {
    schibstedBold: schibstedBold.buffer.slice(schibstedBold.byteOffset, schibstedBold.byteOffset + schibstedBold.byteLength) as ArrayBuffer,
    schibstedBlack: schibstedBlack.buffer.slice(schibstedBlack.byteOffset, schibstedBlack.byteOffset + schibstedBlack.byteLength) as ArrayBuffer,
    notoNaskh: notoNaskh.buffer.slice(notoNaskh.byteOffset, notoNaskh.byteOffset + notoNaskh.byteLength) as ArrayBuffer,
  };
  return fontCache;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const profile = await getProfile(supabase, user.id);
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, reference, category_slug, quantity, participant_names, completed_at, created_at, project_country, project_state, project_village, offerings(title)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const fonts = await loadFonts();
  const seal = await readFile(join(process.cwd(), "public", "brand", "as-sabiquun-seal.png"));
  const sealSrc = `data:image/png;base64,${seal.toString("base64")}`;

  const title = (order.offerings as unknown as { title: string } | null)?.title ?? "As-Sabiqun Project";
  const donorFlag = flagUrl("sg");
  const beneficiaryIso = countryNameToIso2(order.project_country);
  const beneficiaryFlag = flagUrl(beneficiaryIso);
  const dateLabel = formatDate(order.completed_at ?? order.created_at);
  const names = (order.participant_names ?? []).filter(Boolean) as string[];
  const locationLabel = [order.project_village, order.project_state].filter(Boolean).join(", ");
  const showDua = order.category_slug === "water";

  const flagBox = (src: string | null) => (
    <div
      style={{
        display: "flex",
        width: 220,
        height: 140,
        borderRadius: 10,
        overflow: "hidden",
        border: "3px solid #ffffff",
        boxShadow: "0 0 0 2px " + TEAL,
        background: "#e5e5e5",
      }}
    >
      {src ? <img src={src} width={220} height={140} style={{ objectFit: "cover" }} /> : null}
    </div>
  );

  const body = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: CREAM,
        fontFamily: "Schibsted Grotesk",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "48px 64px 24px" }}>
        {flagBox(donorFlag)}
        <div
          style={{
            display: "flex",
            width: 160,
            height: 160,
            borderRadius: "50%",
            overflow: "hidden",
            border: `4px solid ${TEAL}`,
          }}
        >
          <img src={sealSrc} width={160} height={160} style={{ objectFit: "cover" }} />
        </div>
        {flagBox(beneficiaryFlag)}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 48px" }}>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 900, color: TEAL, letterSpacing: -1 }}>{title}</div>
        {dateLabel ? <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: TEAL, marginTop: 4 }}>{dateLabel}</div> : null}
      </div>

      <div
        style={{
          display: "flex",
          flex: 1,
          marginTop: 32,
          background: TEAL,
          position: "relative",
          padding: names.length > 1 ? "40px 56px" : "56px",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {names.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", fontSize: 54, fontWeight: 900, color: "#ffffff", textAlign: "center" }}>{title}</div>
            {locationLabel ? (
              <div
                style={{
                  display: "flex",
                  background: CREAM,
                  color: TEAL_DARK,
                  padding: "14px 32px",
                  borderRadius: 999,
                  fontSize: 30,
                  fontWeight: 700,
                }}
              >
                {locationLabel}
              </div>
            ) : null}
          </div>
        ) : names.length === 1 ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 88, fontWeight: 900, color: "#ffffff", lineHeight: 1.05, textTransform: "uppercase" }}>
              {names[0]}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginTop: 40,
              }}
            >
              {order.reference ? (
                <div
                  style={{
                    display: "flex",
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    background: "#ffffff",
                    color: INK,
                    fontSize: 30,
                    fontWeight: 900,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {order.reference.slice(-2)}
                </div>
              ) : (
                <div />
              )}
              <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: "#ffffff" }}>{packageLabel(title, order.quantity)}</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", width: "100%", height: "100%" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                flex: showDua ? 1 : undefined,
                width: showDua ? undefined : "100%",
              }}
            >
              {names.map((name, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      background: "#ffffff",
                      color: TEAL_DARK,
                      fontSize: 24,
                      fontWeight: 900,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div style={{ display: "flex", fontSize: 30, fontWeight: 900, color: "#ffffff", textTransform: "uppercase" }}>{name}</div>
                </div>
              ))}
            </div>
            {showDua ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  borderLeft: "3px solid rgba(255,255,255,0.35)",
                  paddingLeft: 40,
                  marginLeft: 40,
                  gap: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    background: CREAM,
                    color: TEAL_DARK,
                    padding: "8px 24px",
                    borderRadius: 999,
                    fontSize: 22,
                    fontWeight: 900,
                  }}
                >
                  DOA
                </div>
                <div
                  style={{
                    display: "flex",
                    fontFamily: "Noto Naskh Arabic",
                    fontWeight: 700,
                    fontSize: 28,
                    color: "#ffffff",
                    textAlign: "center",
                    lineHeight: 1.7,
                  }}
                >
                  {WATER_DUA_AR}
                </div>
                <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#ffffff", textAlign: "center", lineHeight: 1.4 }}>
                  {WATER_DUA_EN}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );

  return new ImageResponse(body, {
    width: 1600,
    height: 1000,
    fonts: [
      { name: "Schibsted Grotesk", data: fonts.schibstedBold, weight: 700, style: "normal" },
      { name: "Schibsted Grotesk", data: fonts.schibstedBlack, weight: 900, style: "normal" },
      { name: "Noto Naskh Arabic", data: fonts.notoNaskh, weight: 700, style: "normal" },
    ],
    headers: {
      "Content-Disposition": `inline; filename="${order.reference || id}-nameplate.png"`,
    },
  });
}
