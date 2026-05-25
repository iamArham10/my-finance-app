import Link from "next/link";
import {
    ArrowRight,
    BarChart3,
    CheckCircle2,
    FolderKanban,
    Leaf,
    LineChart,
    ReceiptText,
    ShieldCheck,
    WalletCards,
} from "lucide-react";

const features = [
    {
        icon: FolderKanban,
        title: "Folder-based tracking",
        description:
            "Keep groceries, fuel, bills, travel, and one-off spending separated.",
    },
    {
        icon: WalletCards,
        title: "Budget awareness",
        description:
            "Set monthly folder limits and see which category needs attention first.",
    },
    {
        icon: LineChart,
        title: "Useful analytics",
        description:
            "Review category splits, monthly trends, and the purchases costing most.",
    },
];

const previewRows = [
    { name: "Groceries", icon: "🛒", value: "PKR 18,420", percent: 68 },
    { name: "Fuel", icon: "⛽", value: "PKR 12,000", percent: 54 },
    { name: "Bills", icon: "💡", value: "PKR 9,870", percent: 41 },
];

export default function Home() {
    return (
        <main className="min-h-screen overflow-x-clip bg-[var(--bg-page)] text-[var(--text-primary)]">
            <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-surface)]/90 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
                    <Link href="/" className="flex items-center gap-2">
                        <Leaf className="h-5 w-5 text-[var(--accent)]" />
                        <span className="text-lg font-semibold">Kharcha</span>
                    </Link>
                    <nav className="hidden items-center gap-6 text-sm text-[var(--text-secondary)] md:flex">
                        <a
                            href="#features"
                            className="hover:text-[var(--text-primary)]"
                        >
                            Features
                        </a>
                        <a
                            href="#preview"
                            className="hover:text-[var(--text-primary)]"
                        >
                            Preview
                        </a>
                        <Link
                            href="/login"
                            className="hover:text-[var(--text-primary)]"
                        >
                            Sign in
                        </Link>
                    </nav>
                    <Link href="/login" className="btn-primary h-9">
                        Start tracking
                    </Link>
                </div>
            </header>

            <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl grid-cols-1 items-center gap-10 px-4 py-10 md:grid-cols-[0.9fr_1.1fr] md:px-6 md:py-14">
                <div className="min-w-0">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                        <ShieldCheck className="h-3.5 w-3.5 text-[var(--accent)]" />
                        Private expense tracking for everyday spending
                    </div>
                    <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-normal text-[var(--text-primary)] md:text-6xl">
                        Know where your money went before the month ends.
                    </h1>
                    <p className="mt-5 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
                        Kharcha turns daily purchases into clear folders, budget
                        signals, and spending patterns without forcing you into
                        a complicated accounting system.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/register"
                            className="btn-primary h-11 px-5"
                        >
                            Create account
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/dashboard"
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)]"
                        >
                            Open dashboard
                        </Link>
                    </div>
                    <div className="mt-8 grid max-w-lg grid-cols-1 gap-3 text-sm text-[var(--text-secondary)] sm:grid-cols-3">
                        {["Budgets", "Receipts", "Trends"].map((item) => (
                            <div key={item} className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[var(--accent)]" />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                <div id="preview" className="relative min-w-0">
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[0_24px_80px_rgb(0_0_0_/_0.10)] md:p-5">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
                                    May snapshot
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">
                                    PKR 40,290
                                </p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--accent)]">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                        </div>

                        <div className="grid grid-cols-7 items-end gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-page)] p-4">
                            {[38, 72, 48, 88, 56, 64, 42].map(
                                (height, index) => (
                                    <div
                                        key={index}
                                        className="rounded-t bg-[var(--accent)]"
                                        style={{ height }}
                                    />
                                ),
                            )}
                        </div>

                        <div className="mt-5 space-y-3">
                            {previewRows.map((row) => (
                                <div
                                    key={row.name}
                                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3"
                                >
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className="text-xl">
                                                {row.icon}
                                            </span>
                                            <span className="truncate text-sm font-medium">
                                                {row.name}
                                            </span>
                                        </div>
                                        <span className="mono text-sm text-[var(--accent)]">
                                            {row.value}
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                                        <div
                                            className="h-full rounded-full bg-[var(--accent)]"
                                            style={{ width: `${row.percent}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section
                id="features"
                className="border-y border-[var(--border)] bg-[var(--bg-surface)]"
            >
                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-0 px-4 py-10 md:grid-cols-3 md:px-6">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="border-b border-[var(--border)] py-6 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
                        >
                            <feature.icon className="mb-4 h-5 w-5 text-[var(--accent)]" />
                            <h2 className="text-base font-semibold text-[var(--text-primary)]">
                                {feature.title}
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6">
                <div>
                    <ReceiptText className="mb-3 h-5 w-5 text-[var(--accent)]" />
                    <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                        Start with one folder. Add details as you go.
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                        The workflow stays simple: create a folder, log name,
                        price, quantity, and date, then let the dashboard
                        summarize the month.
                    </p>
                </div>
                <Link href="/register" className="btn-primary h-11 px-5">
                    Get started
                </Link>
            </section>
        </main>
    );
}
