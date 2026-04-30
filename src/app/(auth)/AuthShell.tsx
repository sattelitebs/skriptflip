import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
  altText,
  altLinkLabel,
  altLinkHref,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  altText: string;
  altLinkLabel: string;
  altLinkHref: string;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-balance text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-zinc-400">{subtitle}</p>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8">
        {children}
      </div>

      <p className="mt-6 text-center text-sm text-zinc-400">
        {altText}{" "}
        <Link href={altLinkHref} className="font-semibold text-[var(--color-brand)] hover:underline">
          {altLinkLabel}
        </Link>
      </p>
    </div>
  );
}

export function AuthInput({
  label,
  name,
  type,
  placeholder,
  autoComplete,
  required = true,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-zinc-300">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-md border border-[var(--color-border)] bg-black px-4 py-3 text-white placeholder:text-zinc-600 focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)]"
      />
    </label>
  );
}

export function AuthSubmit({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="w-full rounded-full bg-[var(--color-brand)] px-6 py-3 font-bold text-black transition hover:bg-[var(--color-brand-hover)]"
    >
      {children}
    </button>
  );
}

export function AuthError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mb-6 rounded-md border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-200">
      {message}
    </div>
  );
}

export function AuthInfo({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mb-6 rounded-md border border-[var(--color-brand)]/40 bg-[var(--color-brand)]/10 px-4 py-3 text-sm text-zinc-100">
      {message}
    </div>
  );
}
