import {
  Document,
  Font,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { join } from "node:path";
import { projectCustomerReport, type CompletionReportSource } from "./model";

Font.register({
  family: "Noto Naskh Arabic",
  src: join(process.cwd(), "assets", "fonts", "NotoNaskhArabic-Bold.woff"),
});
Font.registerHyphenationCallback((word) => [word]);

const colours = {
  ivory: "#F7F7F3",
  ink: "#31231B",
  teal: "#1D737F",
  mist: "#DDE6E3",
  gold: "#A27C47",
  muted: "#665D58",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: { backgroundColor: colours.ivory, color: colours.ink, fontFamily: "Helvetica", fontSize: 9, padding: 42, paddingBottom: 54 },
  cover: { backgroundColor: colours.teal, color: colours.white, justifyContent: "space-between" },
  coverTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontFamily: "Helvetica-Bold", fontSize: 11, letterSpacing: 1.4 },
  arabicBrand: { fontFamily: "Noto Naskh Arabic", fontSize: 9 },
  coverMain: { marginTop: 110, width: "82%" },
  eyebrow: { color: colours.gold, fontFamily: "Helvetica-Bold", fontSize: 9, letterSpacing: 1.5, marginBottom: 14, textTransform: "uppercase" },
  coverTitle: { fontFamily: "Helvetica-Bold", fontSize: 34, lineHeight: 1.12, marginBottom: 16 },
  coverLead: { fontSize: 12, lineHeight: 1.6, opacity: 0.9 },
  coverFacts: { borderTop: `1 solid ${colours.mist}`, paddingTop: 18, flexDirection: "row", gap: 28 },
  coverFact: { flexGrow: 1 },
  coverFactLabel: { color: colours.mist, fontSize: 7, letterSpacing: 1.1, marginBottom: 5, textTransform: "uppercase" },
  coverFactValue: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  header: { position: "absolute", left: 42, right: 42, top: 20, flexDirection: "row", justifyContent: "space-between", color: colours.teal, fontSize: 7, letterSpacing: 1 },
  footer: { position: "absolute", left: 42, right: 42, bottom: 20, borderTop: `1 solid ${colours.mist}`, paddingTop: 8, flexDirection: "row", justifyContent: "space-between", color: colours.muted, fontSize: 7 },
  pageTitle: { fontFamily: "Helvetica-Bold", fontSize: 22, color: colours.teal, marginTop: 10, marginBottom: 6 },
  pageLead: { color: colours.muted, lineHeight: 1.5, marginBottom: 14 },
  section: { borderTop: `1 solid ${colours.mist}`, paddingTop: 10, marginBottom: 14 },
  sectionHead: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  sectionNumber: { color: colours.gold, fontFamily: "Helvetica-Bold", width: 25 },
  sectionTitle: { color: colours.teal, fontFamily: "Helvetica-Bold", fontSize: 12 },
  facts: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  fact: { width: "50%", paddingHorizontal: 5, marginBottom: 8 },
  factWide: { width: "100%" },
  label: { color: colours.muted, fontSize: 7, letterSpacing: 0.6, marginBottom: 3, textTransform: "uppercase" },
  value: { fontFamily: "Helvetica-Bold", fontSize: 9.5, lineHeight: 1.4 },
  arabicValue: { fontFamily: "Noto Naskh Arabic", fontSize: 10, lineHeight: 1.6, textAlign: "right" },
  note: { backgroundColor: colours.white, borderLeft: `3 solid ${colours.gold}`, padding: 12, lineHeight: 1.5 },
  statement: { backgroundColor: colours.teal, color: colours.white, padding: 18, marginVertical: 14, lineHeight: 1.6 },
  evidenceGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  evidenceCard: { width: "33.333%", paddingHorizontal: 5, marginBottom: 12 },
  evidenceImage: { width: "100%", height: 72, objectFit: "cover", backgroundColor: colours.mist, marginBottom: 6 },
  evidencePlaceholder: { width: "100%", height: 72, backgroundColor: colours.mist, justifyContent: "center", alignItems: "center", marginBottom: 6 },
  evidencePlaceholderText: { color: colours.teal, fontFamily: "Helvetica-Bold", fontSize: 8 },
  evidenceMeta: { color: colours.muted, fontSize: 7, textTransform: "capitalize" },
  link: { color: colours.teal, textDecoration: "none", fontFamily: "Helvetica-Bold" },
  listRow: { flexDirection: "row", borderBottom: `1 solid ${colours.mist}`, paddingVertical: 7 },
  evidenceList: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  evidenceListItem: { width: "50%", paddingRight: 8 },
  listPrimary: { width: "38%", fontFamily: "Helvetica-Bold", paddingRight: 8 },
  listSecondary: { width: "62%", color: colours.muted, lineHeight: 1.35 },
  timelineRow: { flexDirection: "row", marginBottom: 7 },
  timelineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colours.gold, marginTop: 2, marginRight: 9 },
  timelineBody: { flexGrow: 1 },
  timelineTitle: { fontFamily: "Helvetica-Bold", marginBottom: 2 },
  timelineDate: { color: colours.muted, fontSize: 7 },
  summaryRail: { flexDirection: "row", marginHorizontal: -4, marginBottom: 14 },
  summaryItem: { flexGrow: 1, marginHorizontal: 4, backgroundColor: colours.white, border: `1 solid ${colours.mist}`, padding: 8 },
  summaryValue: { fontFamily: "Helvetica-Bold", color: colours.teal, fontSize: 11, marginTop: 4 },
});

function date(value: string | null) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-SG", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Singapore" }).format(new Date(value));
}

function money(cents: number) {
  return new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(cents / 100);
}

function words(value: string | null | undefined) {
  return value?.trim() || "Not recorded";
}

function category(value: string) {
  return value.replaceAll("_", " ");
}

function arabic(value: string) {
  return `\u2067${value}\u2069`;
}

function RunningChrome({ reference, kind, repeat = true }: { reference: string; kind: string; repeat?: boolean }) {
  const repeatProps = repeat ? { fixed: true } : {};
  return (
    <>
      <View {...repeatProps} style={styles.header}><Text>AS-SABIQUUN</Text><Text>{reference} / {kind}</Text></View>
      <View {...repeatProps} style={styles.footer}>
        <Text>Private completion record</Text>
        <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}><Text style={styles.sectionNumber}>{number}</Text><Text style={styles.sectionTitle}>{title}</Text></View>
      {children}
    </View>
  );
}

function Facts({ children }: { children: ReactNode }) {
  return <View style={styles.facts}>{children}</View>;
}

function Fact({ label, children, wide = false, arabicText = false }: { label: string; children: ReactNode; wide?: boolean; arabicText?: boolean }) {
  return <View style={[styles.fact, wide ? styles.factWide : {}]}><Text style={styles.label}>{label}</Text><Text style={arabicText ? styles.arabicValue : styles.value}>{children || "Not recorded"}</Text></View>;
}

function Cover({ source, kind }: { source: CompletionReportSource; kind: "Customer completion report" | "Internal completion record" }) {
  return (
    <Page size="A4" style={[styles.page, styles.cover]}>
      <View style={styles.coverTop}><Text style={styles.brand}>AS-SABIQUUN</Text><Text style={styles.arabicBrand}>{arabic("السابقون")}</Text></View>
      <View style={styles.coverMain}>
        <Text style={styles.eyebrow}>Amanah documented</Text>
        <Text style={styles.coverTitle}>{kind}</Text>
        <Text style={styles.coverLead}>{source.job.packagePurchased} - a verified record from assignment through completion evidence.</Text>
      </View>
      <View style={styles.coverFacts}>
        <View style={styles.coverFact}><Text style={styles.coverFactLabel}>Project reference</Text><Text style={styles.coverFactValue}>{source.job.reference}</Text></View>
        <View style={styles.coverFact}><Text style={styles.coverFactLabel}>Verified</Text><Text style={styles.coverFactValue}>{date(source.verification.verifiedAt)}</Text></View>
        <View style={styles.coverFact}><Text style={styles.coverFactLabel}>Location</Text><Text style={styles.coverFactValue}>{source.location.country}</Text></View>
      </View>
    </Page>
  );
}

function Evidence({ source, thumbnails }: { source: CompletionReportSource; thumbnails: Record<string, Buffer> }) {
  const photos = source.evidence.filter((item) => item.mediaType === "photo");
  const videos = source.evidence.filter((item) => item.mediaType === "video");
  const phases = ["before_photo", "during_photo", "after_photo"].map((phase) => photos.find((item) => item.category === phase)).filter(Boolean) as CompletionReportSource["evidence"];
  return (
    <>
      <View style={styles.evidenceGrid}>
        {phases.map((proof) => <View key={proof.id} style={styles.evidenceCard} wrap={false}>
          {thumbnails[proof.id]
            // @react-pdf Image has no HTML alt prop; the adjacent text names the evidence.
            ? <Image src={thumbnails[proof.id]} style={styles.evidenceImage} /> // eslint-disable-line jsx-a11y/alt-text
            : <View style={styles.evidencePlaceholder}><Text style={styles.evidencePlaceholderText}>Secure photo</Text></View>}
          <Text style={styles.evidenceMeta}>{category(proof.category)}</Text>
        </View>)}
      </View>
      <View style={styles.summaryRail}>
        <View style={styles.summaryItem}><Text style={styles.label}>Approved photos</Text><Text style={styles.summaryValue}>{photos.length}</Text></View>
        <View style={styles.summaryItem}><Text style={styles.label}>Approved videos</Text><Text style={styles.summaryValue}>{videos.length}</Text></View>
        <View style={styles.summaryItem}><Text style={styles.label}>Submission</Text><Text style={styles.summaryValue}>v{source.verification.submissionVersion}</Text></View>
      </View>
      <Text style={styles.note}>Videos and the full-resolution evidence remain private. <Link style={styles.link} src={`${source.projectPortalUrl}#evidence`}>Open the secure project portal</Link> to view them.</Text>
    </>
  );
}

function CustomerDocument({ source, thumbnails }: { source: CompletionReportSource; thumbnails: Record<string, Buffer> }) {
  const customer = projectCustomerReport(source);
  return (
    <Document title={`${source.job.reference} completion report`} author="As-Sabiquun Association Consultancy" subject="Verified customer completion record">
      <Cover source={source} kind="Customer completion report" />
      <Page size="A4" style={styles.page}>
        <RunningChrome reference={source.job.reference} kind="CUSTOMER" />
        <Text style={styles.pageTitle}>Your project record</Text>
        <Text style={styles.pageLead}>Assalamu alaikum {customer.customerName}. This report records the project information reviewed and approved by As-Sabiquun.</Text>
        <View style={styles.statement}><Text>{customer.completionStatement}</Text></View>
        <Section number="01" title="Project information"><Facts>
          <Fact label="Reference">{customer.job.reference}</Fact><Fact label="Service">{customer.job.serviceType}</Fact>
          <Fact label="Package">{customer.job.packagePurchased}</Fact><Fact label="Contribution">{money(customer.job.packagePrice)}</Fact>
          <Fact label="Order received">{date(customer.job.createdAt)}</Fact><Fact label="Verified">{date(source.verification.verifiedAt)}</Fact>
          <Fact label="Processing time">{customer.job.totalProcessingTime}</Fact><Fact label="Currency">{customer.job.currency}</Fact>
          <Fact label="Payment receipt" wide><Link style={styles.link} src={customer.receiptUrl}>Download authenticated receipt</Link></Fact>
        </Facts></Section>
        <Section number="02" title="Dedication"><Facts>
          <Fact label="Name(s)" wide>{customer.dedication.names.join(", ") || "Not supplied"}</Fact>
          <Fact label="Arabic spelling" wide arabicText>{customer.dedication.arabicSpelling ? arabic(customer.dedication.arabicSpelling) : "Not supplied"}</Fact>
          <Fact label="Remarks" wide>{words(customer.dedication.remarks)}</Fact>
        </Facts></Section>
        <Section number="03" title="Beneficiary"><Facts>
          <Fact label="Country">{words(customer.beneficiary.country)}</Fact><Fact label="State / district">{words(customer.beneficiary.state)}</Fact>
          <Fact label="Village / locality">{words(customer.beneficiary.village)}</Fact><Fact label="Partner organisation">{words(customer.beneficiary.partnerOrganisation)}</Fact>
          <Fact label="Beneficiary name(s)" wide>{customer.beneficiary.names.join(", ") || "Not applicable"}</Fact>
        </Facts></Section>
      </Page>
      <Page size="A4" style={styles.page}>
        <RunningChrome reference={source.job.reference} kind="CUSTOMER" />
        <Text style={styles.pageTitle}>Place and evidence</Text>
        <Text style={styles.pageLead}>The location and evidence below are taken from the approved vendor submission.</Text>
        <Section number="04" title="Project location"><Facts>
          <Fact label="Country">{customer.location.country}</Fact><Fact label="State / district">{customer.location.state}</Fact>
          <Fact label="Village / locality">{customer.location.village}</Fact><Fact label="Coordinates">{customer.location.latitude}, {customer.location.longitude}</Fact>
          <Fact label="Address / description" wide>{customer.location.address}</Fact>
          {customer.location.mapsLink && <Fact label="Map" wide><Link style={styles.link} src={customer.location.mapsLink}>Open map location</Link></Fact>}
        </Facts></Section>
        <Section number="05" title="Approved completion evidence"><Evidence source={source} thumbnails={thumbnails} /></Section>
        <Section number="06" title="Project journey">
          {customer.timeline.map((event) => <View key={`${event.label}-${event.createdAt}`} style={styles.timelineRow} wrap={false}><View style={styles.timelineDot} /><View style={styles.timelineBody}><Text style={styles.timelineTitle}>{event.label}</Text><Text style={styles.timelineDate}>{date(event.createdAt)}</Text></View></View>)}
        </Section>
      </Page>
    </Document>
  );
}

function InternalDocument({ source, thumbnails }: { source: CompletionReportSource; thumbnails: Record<string, Buffer> }) {
  const paid = source.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const outstanding = Math.max(0, source.job.vendorCost - paid);
  const inventory = Object.entries(source.evidence.reduce<Record<string, { count: number; mediaType: string }>>((items, proof) => {
    const item = items[proof.category] ??= { count: 0, mediaType: proof.mediaType };
    item.count += 1;
    return items;
  }, {}));
  return (
    <Document title={`${source.job.reference} internal completion record`} author="As-Sabiquun Association Consultancy" subject="Internal operational and audit record">
      <Cover source={source} kind="Internal completion record" />
      <Page size="A4" style={styles.page}>
        <RunningChrome reference={source.job.reference} kind="INTERNAL" repeat={false} />
        <Text style={styles.pageTitle}>People and project</Text><Text style={styles.pageLead}>Restricted operational record. Contains customer, vendor, financial, and verification information.</Text>
        <Section number="01" title="Job information"><Facts>
          <Fact label="Job ID" wide>{source.job.id}</Fact><Fact label="Service type">{source.job.serviceType}</Fact><Fact label="Package purchased">{source.job.packagePurchased}</Fact>
          <Fact label="Job creation date">{date(source.job.createdAt)}</Fact><Fact label="Assignment date">{date(source.job.assignedAt)}</Fact>
          <Fact label="Completion date">{date(source.job.completedAt)}</Fact><Fact label="Total processing time">{source.job.totalProcessingTime}</Fact>
        </Facts></Section>
        <Section number="02" title="Customer information"><Facts>
          <Fact label="Customer name">{source.customer.name}</Fact><Fact label="Contact number">{source.customer.phone}</Fact>
          <Fact label="Email address">{source.customer.email}</Fact><Fact label="Invoice / order number">{source.customer.invoiceNumber}</Fact>
        </Facts></Section>
        <Section number="03" title="Beneficiary information"><Facts>
          <Fact label="Country">{words(source.beneficiary.country)}</Fact><Fact label="State / district">{words(source.beneficiary.state)}</Fact>
          <Fact label="Village / locality">{words(source.beneficiary.village)}</Fact><Fact label="Partner organisation">{words(source.beneficiary.partnerOrganisation)}</Fact>
          <Fact label="Beneficiary name(s)" wide>{source.beneficiary.names.join(", ") || "Not applicable"}</Fact>
        </Facts></Section>
        <Section number="04" title="Dedication / nameplate details"><Facts>
          <Fact label="Name(s)" wide>{source.dedication.names.join(", ") || "Not supplied"}</Fact><Fact label="Arabic spelling" wide arabicText>{source.dedication.arabicSpelling ? arabic(source.dedication.arabicSpelling) : "Not supplied"}</Fact>
          <Fact label="Dedication remarks" wide>{words(source.dedication.remarks)}</Fact>
        </Facts></Section>
      </Page>
      <Page size="A4" style={styles.page}>
        <RunningChrome reference={source.job.reference} kind="INTERNAL" repeat={false} />
        <Text style={styles.pageTitle}>Partner, place and review</Text>
        <Section number="05" title="Vendor information"><Facts>
          <Fact label="Vendor name">{source.vendor.name}</Fact><Fact label="Vendor ID">{source.vendor.id}</Fact>
          <Fact label="Date and time accepted">{date(source.vendor.acceptedAt)}</Fact><Fact label="Submitted by">{source.vendor.submittedBy}</Fact>
          <Fact label="Settlement bank" wide>{[source.vendor.bankDetails.bankName, source.vendor.bankDetails.accountName, source.vendor.bankDetails.accountNumber, source.vendor.bankDetails.swiftCode].filter(Boolean).join(" / ") || "Not recorded"}</Fact>
        </Facts></Section>
        <Section number="06" title="Project location"><Facts>
          <Fact label="Country">{source.location.country}</Fact><Fact label="State / district">{source.location.state}</Fact>
          <Fact label="Village / locality">{source.location.village}</Fact><Fact label="GPS coordinates">{source.location.latitude}, {source.location.longitude}</Fact>
          <Fact label="Exact address / description" wide>{source.location.address}</Fact>
          {source.location.mapsLink && <Fact label="Google Maps" wide><Link style={styles.link} src={source.location.mapsLink}>Open map location</Link></Fact>}
        </Facts></Section>
        <Section number="08" title="Vendor remarks"><Text style={styles.note}>{source.vendorRemarks}</Text></Section>
        <Section number="09" title="Admin verification"><Facts>
          <Fact label="Verification status">Approved</Fact><Fact label="Submission version">v{source.verification.submissionVersion}</Fact>
          <Fact label="Verified by">{source.verification.verifiedBy}</Fact><Fact label="Verification date">{date(source.verification.verifiedAt)}</Fact>
          <Fact label="Verification notes" wide>{words(source.verification.notes)}</Fact>
        </Facts></Section>
      </Page>
      <Page size="A4" style={styles.page}>
        <RunningChrome reference={source.job.reference} kind="INTERNAL" repeat={false} />
        <Text style={styles.pageTitle}>Completion evidence</Text>
        <Text style={styles.pageLead}>Approved media inventory for submission v{source.verification.submissionVersion}.</Text>
        <Section number="07" title="Completion evidence"><Evidence source={source} thumbnails={thumbnails} />
          <View style={styles.evidenceList}>
            {inventory.map(([evidenceCategory, item]) => <View key={evidenceCategory} style={[styles.listRow, styles.evidenceListItem]} wrap={false}><Text style={styles.listPrimary}>{category(evidenceCategory)}</Text><Text style={styles.listSecondary}>{item.count} approved {item.mediaType}{item.count === 1 ? "" : "s"}</Text></View>)}
          </View>
        </Section>
      </Page>
      <Page size="A4" style={styles.page}>
        <RunningChrome reference={source.job.reference} kind="INTERNAL" repeat={false} />
        <Text style={styles.pageTitle}>Delivery, finance and audit</Text>
        <Section number="10" title="Customer notification">
          {source.notifications.length ? source.notifications.map((notification, index) => <View key={`${notification.channel}-${index}`} style={styles.listRow} wrap={false}><Text style={styles.listPrimary}>{notification.channel} / {notification.status}</Text><Text style={styles.listSecondary}>Attempted {date(notification.attemptedAt)}; sent {date(notification.sentAt)}; delivered {date(notification.deliveredAt)}{notification.error ? `; error: ${notification.error}` : ""}</Text></View>) : <Text style={styles.note}>Delivery attempts have not been recorded yet.</Text>}
        </Section>
        <Section number="11" title="Payment tracking"><Facts>
          <Fact label="Package price">{money(source.job.packagePrice)}</Fact><Fact label="Vendor cost">{money(source.job.vendorCost)}</Fact>
          <Fact label="Amount paid">{money(paid)}</Fact><Fact label="Outstanding balance">{money(outstanding)}</Fact>
        </Facts>
          {source.payments.map((payment, index) => <View key={`${payment.reference}-${index}`} style={styles.listRow} wrap={false}><Text style={styles.listPrimary}>{money(payment.amount)}</Text><Text style={styles.listSecondary}>{date(payment.date)} / {words(payment.method)} / {words(payment.reference)}</Text></View>)}
        </Section>
        <Section number="12" title="Audit timeline">
          {source.audit.map((event, index) => <View key={`${event.eventType}-${event.createdAt}-${index}`} style={styles.timelineRow} wrap={false}><View style={styles.timelineDot} /><View style={styles.timelineBody}><Text style={styles.timelineTitle}>{event.eventType.replaceAll(".", " ")}</Text><Text style={styles.timelineDate}>{date(event.createdAt)} / {event.actorRole}</Text></View></View>)}
        </Section>
      </Page>
    </Document>
  );
}

export async function renderCompletionReport(kind: "customer" | "internal", source: CompletionReportSource, thumbnails: Record<string, Buffer> = {}) {
  return renderToBuffer(kind === "customer" ? <CustomerDocument source={source} thumbnails={thumbnails} /> : <InternalDocument source={source} thumbnails={thumbnails} />);
}
