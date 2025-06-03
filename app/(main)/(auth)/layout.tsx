import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-6">
      <div className="mb-8">
        <Image
          src="/Shamp-mark.svg"
          alt="Shamp Logo"
          width={120}
          height={40}
          className="dark:hidden"
        />
        <Image
          src="/Shamp-mark.svg"
          alt="Shamp Logo"
          width={120}
          height={40}
          className="hidden dark:block"
        />
      </div>
      {children}
    </div>
  );
}
