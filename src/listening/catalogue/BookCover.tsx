import type { CLASSIC_BOOKS } from "./books";
import styles from "./BookCatalogue.module.css";

type Cover = (typeof CLASSIC_BOOKS)[number]["cover"];

/** Original geometric illustrations authored for TOLK; no publisher covers or external assets. */
export function BookCover({ cover, color }: { cover: Cover; color: string }) {
  const artwork = {
    alice: <><path d="M40 132h80v20H40zM50 115h60v17H50z" fill="currentColor" opacity=".22"/><circle cx="80" cy="71" r="30"/><path d="M75 33h10v8H75zM80 51v21l13 9M72 17l-3 10m22-10 3 10"/><circle cx="80" cy="72" r="3" fill="currentColor"/></>,
    sherlock: <><path d="M27 145V98h20v47m7 0V82h17m24 63V91h15v54m7 0v-34h17" opacity=".4"/><circle cx="78" cy="65" r="29"/><path d="m99 86 27 34" strokeWidth="9"/><path d="M61 66c0-10 7-18 17-18" opacity=".6"/></>,
    treasure: <><path d="M20 133q15-12 30 0t30 0 30 0 30 0M20 145q15-12 30 0t30 0 30 0 30 0"/><path d="m32 113 19-28 31-5 39 33Z" fill="currentColor" opacity=".25"/><path d="M80 80V36m0 0 27 25H80M54 97l13 13m0-13-13 13"/><circle cx="120" cy="35" r="8"/></>,
    time: <><circle cx="80" cy="83" r="42"/><circle cx="80" cy="83" r="32" opacity=".4"/><path d="M80 58v25l20 13M80 34v-9m0 116v-9M31 83h-9m116 0h-9"/><ellipse cx="80" cy="83" rx="68" ry="19" transform="rotate(-35 80 83)" opacity=".7"/></>,
    pride: <><path d="M35 132V78h90v54M29 78l51-32 51 32M68 132v-29h24v29M50 90h8v10h-8m44-10h8v10h-8"/><path d="M20 147q60-25 120 0M22 116q-13-27 4-44m112 44q13-27-4-44" opacity=".6"/><path d="M45 38h21m27 0h22"/></>,
    cities: <><path d="M20 128V68h22v60m0 0V90h18v38m40 0V85h18v43m0 0V53h22v75M25 68l6-13 6 13M122 53l7-16 7 16M18 143h124M59 128q21-36 42 0"/><path d="M73 28v21m14-21v21" opacity=".5"/></>,
    frankenstein: <><path d="m91 21-30 48h23l-13 35 34-47H81Z" fill="currentColor" stroke="none"/><path d="M63 102v16l-23 31h80l-23-31v-16M57 133h46"/><path d="M36 29v12m-6-6h12m83 59v12m-6-6h12" opacity=".6"/></>,
    dracula: <><circle cx="111" cy="45" r="20" fill="currentColor" opacity=".35"/><path d="M28 150V94l15-24 15 24v56m0-27V98h44v52m0 0V82l15-24 15 24v68M72 150v-25h16v25M37 106h12m62-12h12M28 150h104"/><path d="m25 42 10 4 10-4m9-15 8 3 8-3" opacity=".8"/></>,
    franklin: <><path d="m80 26-21 30 21 23 21-23ZM80 79q-25 18-7 32t-2 30M53 152h58M88 115l26-47q17 25-11 52Z"/><path d="m99 120-17 27m-45-98 5 10m78-18-4 10" opacity=".5"/></>,
    meditations: <><path d="M48 55h64v14H48zM54 69v65m52-65v65M48 134h64v14H48zM68 75v52m24-52v52"/><path d="M35 135Q6 90 35 55m90 80q29-45 0-80M30 109l-11-3m9-15-11-9m13-5-6-11m106 43 11-3m-9-15 11-9m-13-5 6-11" opacity=".65"/></>,
    origin: <><path d="M80 151V94m0 18L52 86m28 17 30-29M52 86V58m0 16L34 58m46 36V47m0 16L63 45m47 29V43m0 18 18-15"/><circle cx="34" cy="52" r="8" fill="currentColor"/><circle cx="52" cy="45" r="10" fill="currentColor"/><circle cx="80" cy="36" r="11" fill="currentColor"/><circle cx="111" cy="31" r="8" fill="currentColor"/><circle cx="132" cy="40" r="7" fill="currentColor"/><path d="M47 153h66"/></>,
  };
  return <svg aria-hidden="true" className={styles.cover} viewBox="0 0 160 180" style={{ backgroundColor: color }} fill="none" color="#f4e6bf" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 9h142v162H9Z" opacity=".35"/>{artwork[cover]}</svg>;
}
