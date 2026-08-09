import Link from "next/link";
import { Syne, Zen_Kaku_Gothic_New } from "next/font/google";
import styles from "./landing.module.css";

const brandFont = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-landing-brand",
});

const bodyFont = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-landing-body",
});

export function LandingPage() {
  return (
    <div
      className={`${styles.root} ${brandFont.variable} ${bodyFont.variable}`}
    >
      <section className={styles.hero} aria-labelledby="landing-headline">
        <div className={styles.visualPlane} aria-hidden="true">
          <div className={styles.orbPrimary} />
          <div className={styles.orbSecondary} />
          <div className={styles.horizon} />
        </div>

        <div className={styles.heroInner}>
          <p className={styles.brand}>Gmail Kanban</p>
          <h1 id="landing-headline" className={styles.headline}>
            メールの案件を、カンバンで追う。
          </h1>
          <p className={styles.support}>
            Gmail のスレッドを案件カードにし、進捗と期限を一覧する。
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/sign-up" className={styles.ctaPrimary}>
              はじめる
            </Link>
            <Link href="/sign-in" className={styles.ctaSecondary}>
              ログイン
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.flow} aria-labelledby="landing-flow-title">
        <h2 id="landing-flow-title" className={styles.flowTitle}>流れ</h2>
        <ol className={styles.flowSteps}>
          <li>Gmail URL を貼って案件を作る</li>
          <li>カンバンでステータスを動かす</li>
          <li>期限が近い案件をアラートで確認する</li>
        </ol>
      </section>
    </div>
  );
}
