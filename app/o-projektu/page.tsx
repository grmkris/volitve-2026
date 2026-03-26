import Link from "next/link"

import { PageHeader } from "@/components/layout/page-header"

export default function OProjektuPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <PageHeader title="O projektu" />

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <div className="rounded-lg bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-heading text-base font-semibold">Kaj je to?</h2>
            <p className="mt-2 text-muted-foreground">
              Odprtokodni projekt za interaktivno vizualizacijo rezultatov
              volitev v Državni zbor Republike Slovenije 2026. Omogoča pregled
              rezultatov po volilnih enotah, okrajih in posameznih voliščih,
              sestavljanje koalicij, primerjavo z volitvami 2022 ter demografsko
              analizo na ravni okrajev.
            </p>
          </div>
        </section>

        <section>
          <div className="rounded-lg bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-heading text-base font-semibold">
              Viri podatkov
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong className="text-foreground">DVK 2026:</strong>{" "}
                <a
                  href="https://volitve.dvk-rs.si/dz2026/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Državna volilna komisija
                </a>{" "}
                — rezultati glasovanja, udeležba, kandidati in podatki po
                voliščih (JSON API)
              </li>
              <li>
                <strong className="text-foreground">DVK 2022:</strong>{" "}
                <a
                  href="https://www.dvk-rs.si/arhivi/dz2022/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Arhiv DVK
                </a>{" "}
                — rezultati parlamentarnih volitev 2022 za primerjavo premikov
              </li>
              <li>
                <strong className="text-foreground">GURS RPE:</strong>{" "}
                <a
                  href="https://github.com/stefanb/gurs-rpe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Register prostorskih enot
                </a>{" "}
                — meje volilnih enot, okrajev, volišč in občin (CC-BY 4.0,
                Geodetska uprava RS)
              </li>
              <li>
                <strong className="text-foreground">SURS:</strong>{" "}
                <a
                  href="https://pxweb.stat.si/SiStat/sl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Statistični urad RS
                </a>{" "}
                — povprečne mesečne bruto plače (2023), prebivalstvo po starosti
                (2025), stopnja izobrazbe (2025) in zaposlenost po izobrazbi
                (2025) — vse na ravni 212 občin
              </li>
            </ul>
          </div>
        </section>

        <section>
          <div className="rounded-lg bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-heading text-base font-semibold">
              Metodologija
            </h2>
            <div className="mt-2 space-y-3 text-muted-foreground">
              <div>
                <h3 className="text-xs font-medium text-foreground">
                  Primerjava z 2022
                </h3>
                <p className="mt-1">
                  Stranke med volitvama se razlikujejo. Neposredni nasledniki
                  (SVOBODA, SDS, SD, Resni.ca, SNS, Pirati) se primerjajo
                  neposredno. Združene liste (LEVICA IN VESNA = Levica + Vesna;
                  NSi, SLS, FOKUS ≈ NSi) primerjamo s seštevkom predhodnic. Nove
                  stranke (DEMOKRATI, PREROD) nimajo izhodišča 2022.
                </p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-foreground">
                  Ideološki bloki
                </h3>
                <p className="mt-1">
                  Za agregatno analizo premikov uporabljamo 4 bloke: levi
                  (Levica in Vesna, SD), center-levi (Svoboda, Demokrati,
                  Prerod), desni (SDS, NSi/SLS/Fokus) in populistični (Resni.ca,
                  SNS).
                </p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-foreground">
                  Demografska analiza
                </h3>
                <p className="mt-1">
                  Podatki SURS (plače, starost prebivalstva, izobrazba,
                  zaposlenost) so na ravni 212 občin, volilni rezultati pa na
                  ravni 88 okrajev. Občine preslikamo na okraje tako, da
                  centroid vsake občine uvrstimo v okraj, ki ga vsebuje (Turf.js
                  point-in-polygon), nato demografske kazalnike tehtamo po
                  površini občin. Stran prikazuje korelacije med 5 kazalniki
                  (plača, delež starejših 65+, višja izobrazba, zaposleni z
                  višjo izobrazbo, udeležba) in deležem glasov za posamezno
                  stranko. Prikazane korelacije so agregatne in ne odražajo
                  posameznikov (ekološka zmota).
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="rounded-lg bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-heading text-base font-semibold">
              Volilni sistem
            </h2>
            <p className="mt-2 text-muted-foreground">
              Slovenija ima proporcionalni volilni sistem z 8 volilnimi enotami,
              vsaka voli 11 poslancev. Sedeži se razdelijo po D&apos;Hondtovem
              sistemu. Za vstop v Državni zbor mora stranka prejeti najmanj 4 %
              veljavnih glasov na nacionalni ravni. Skupaj se voli 88 poslancev
              plus 2 predstavnika narodnih manjšin (italijanske in madžarske).
            </p>
          </div>
        </section>

        <section>
          <div className="rounded-lg bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-heading text-base font-semibold">
              Tehnologija
            </h2>
            <p className="mt-2 text-muted-foreground">
              Next.js 16 + React 19 + TypeScript z imenovanimi tipi (branded
              IDs) za tipsko varnost. MapLibre GL JS za interaktivne zemljevide
              s Carto podlogami. Tailwind CSS 4 za oblikovanje. TanStack Query
              za upravljanje geopodatkov. Turf.js za prostorske analize
              (preslikava občin → okraji). Podatki se osvežujejo vsakih 30
              sekund iz DVK API-ja s statičnim JSON-om kot rezervo.
            </p>
          </div>
        </section>

        <section>
          <div className="rounded-lg bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-heading text-base font-semibold">Opombe</h2>
            <p className="mt-2 text-muted-foreground">
              Ta stran ni uradni vir rezultatov. Za uradne rezultate obiščite{" "}
              <a
                href="https://volitve.dvk-rs.si/dz2026/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                volitve.dvk-rs.si
              </a>
              . Podatki se lahko razlikujejo od končnih uradnih rezultatov.
              Izvorna koda je javno dostopna na GitHubu.
            </p>
          </div>
        </section>
      </div>

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Nazaj na pregled
      </Link>
    </div>
  )
}
