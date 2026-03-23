import { PageHeader } from "@/components/layout/page-header"

export default function OProjektuPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <PageHeader title="O projektu" />

      <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="font-heading text-base font-semibold">
            Kaj je to?
          </h2>
          <p>
            Interaktivna vizualizacija rezultatov volitev v Državni zbor
            Republike Slovenije 2026. Stran omogoča pregled rezultatov po
            volilnih enotah, okrajih in posameznih voliščih, ter analizo
            volilne udeležbe.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-semibold">
            Viri podatkov
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Volilni rezultati:</strong>{" "}
              <a
                href="https://volitve.dvk-rs.si/dz2026/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                Državna volilna komisija (DVK)
              </a>{" "}
              — uradni podatki o izidih glasovanja v JSON obliki
            </li>
            <li>
              <strong>Geografske meje:</strong>{" "}
              <a
                href="https://github.com/stefanb/gurs-rpe"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                Register prostorskih enot (GURS RPE)
              </a>{" "}
              — meje volilnih enot, okrajev in volišč (CC-BY 4.0, Geodetska
              uprava RS)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-base font-semibold">
            Volilni sistem
          </h2>
          <p>
            Slovenija ima proporcionalni volilni sistem z 8 volilnimi enotami,
            vsaka voli 11 poslancev. Sedeži se razdelijo po D&apos;Hondtovem
            sistemu. Za vstop v Državni zbor mora stranka prejeti najmanj 4 %
            veljavnih glasov na nacionalni ravni. Skupaj se voli 88 poslancev
            plus 2 predstavnika narodnih manjšin (italijanske in madžarske).
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-semibold">Tehnologija</h2>
          <p>
            Stran je zgrajena z Next.js, React, TypeScript in Tailwind CSS.
            Zemljevid uporablja MapLibre GL JS. Vsi podatki so statično generirani
            ob gradnji (SSG) za hitro nalaganje.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-semibold">Opombe</h2>
          <p>
            Ta stran ni uradni vir rezultatov. Za uradne rezultate obiščite{" "}
            <a
              href="https://volitve.dvk-rs.si/dz2026/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              volitve.dvk-rs.si
            </a>
            . Podatki se lahko razlikujejo od končnih uradnih rezultatov.
          </p>
        </section>
      </div>
    </div>
  )
}
