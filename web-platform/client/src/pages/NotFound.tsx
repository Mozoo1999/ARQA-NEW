import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      <Card className="w-full max-w-lg mx-4 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-red-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-slate-700 mb-4">
            الصفحة غير موجودة
          </h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها.
            <br />
            يرجى التحقق من الرابط أو العودة إلى الصفحة الرئيسية.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => setLocation("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg"
            >
              <Home className="w-4 h-4 ml-2" />
              العودة إلى الرئيسية
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="px-6 py-2.5 rounded-lg"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              الصفحة السابقة
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-6">NARQA EBOS — نظام التشغيل المؤسسي</p>
        </CardContent>
      </Card>
    </div>
  );
}
