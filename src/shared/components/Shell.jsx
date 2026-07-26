import Header from "./Header.jsx";

export default function Shell({
  children,
  header = false,
  back = false,
  user,
}) {
  return (
    <>
      {header && <Header back={back} user={user} />}
      <main>{children}</main>
      <footer className="ft">
        반틈 BAN-TEUM — 세상 모든 고민, 딱 반틈만
      </footer>
    </>
  );
}
