import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Cake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, Title, Lede, GoldDivider } from "@/components/ds";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blush to-background px-5">
      <div className="text-center">
        <div className="gradient-pink shadow-berry-soft mx-auto mb-6 grid size-20 place-items-center rounded-2xl text-primary-foreground ring-1 ring-gold/40">
          <Cake className="size-10" />
        </div>
        <Eyebrow rule="both" caps className="justify-center">
          ٤٠٤
        </Eyebrow>
        <Title variant="display" as="h1" className="mt-3">
          هذي الصفحة مو موجودة
        </Title>
        <GoldDivider />
        <Lede className="mx-auto max-w-md">
          يمكن الرابط تغيّر أو انكتب غلط — رجّعناك للبداية وتقدر تكمل تسوّق من هنا.
        </Lede>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="brand" size="pill" onClick={() => navigate("/")}>
            العودة للرئيسية
          </Button>
          <Button variant="outlineBrand" size="pill" onClick={() => navigate("/shop")}>
            تصفّح المنتجات
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
