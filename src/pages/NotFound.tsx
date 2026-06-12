import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Cake } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Cake className="w-8 h-8 text-primary" />
        </div>
        <h1 className="mb-2 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">عذراً، الصفحة غير موجودة</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
