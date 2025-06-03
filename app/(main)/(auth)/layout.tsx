import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="h-screen flex flex-col bg-background py-6 w-full gap-6">
      <section className="w-full flex items-center justify-center">
        <Image
          src="/Shamp-logo-light.svg"
          alt="Shamp Logo"
          width={120}
          height={40}
          className="dark:hidden"
        />
        <Image
          src="/Shamp-logo-dark.svg"
          alt="Shamp Logo"
          width={120}
          height={40}
          className="hidden dark:block"
        />
      </section>
      {children}
    </section>
  );
}
