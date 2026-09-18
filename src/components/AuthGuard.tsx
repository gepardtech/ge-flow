import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getSession, peekSession, subscribeToSession } from "@/lib/authSession";

interface Props {
  children: ReactNode;
}

/**
 * Wraps every authenticated route (/dashboard/*, /setup/*) and enforces a
 * valid session. Unauthenticated visitors are sent to /login.
 *
 * Session resolution is delegated to the shared authSession module so the
 * preview and the live site behave identically and only one auth request is
 * ever in flight.
 */
const AuthGuard = ({ children }: Props) => {
  const [allowed, setAllowed] = useState<boolean>(Boolean(peekSession()));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;

    const unsubscribe = subscribeToSession((session) => {
      if (!active) return;
      if (session) {
        setAllowed(true);
      } else {
        setAllowed(false);
        navigate("/login", { replace: true });
      }
    });

    getSession().then((session) => {
      if (!active) return;
      if (session) {
        setAllowed(true);
      } else {
        navigate("/login", { replace: true, state: { from: location.pathname } });
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [navigate, location.pathname]);

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm font-medium">
        Verifying session...
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
