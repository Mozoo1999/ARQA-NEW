import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookOpen, Calendar, DollarSign, Target, Users } from "lucide-react";
import { useLocation, useParams } from "wouter";

const STATUS_LABELS: Record<string, string> = {
  planning: "تخطيط", active: "نشط", on_hold: "متوقف", completed: "مكتمل", cancelled: "ملغى",
};
const PRIORITY_LABELS: Record<string, string> = {
  low: "منخفض", medium: "متوسط", high: "عالي", critical: "حرج",
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id ?? "0");

  const { data: project, isLoading } = trpc.projects.getById.useQuery({ id: projectId }, { enabled: !!projectId });
  const { data: team } = trpc.projects.getTeam.useQuery({ projectId }, { enabled: !!projectId });

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );

  if (!project) return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="text-muted-foreground">المشروع غير موجود</p>
      <Button variant="link" onClick={() => setLocation("/projects")}>العودة للمشاريع</Button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <button onClick={() => setLocation("/projects")} className="hover:text-foreground flex items-center gap-1">
              <ArrowRight className="h-3.5 w-3.5" />
              المشاريع
            </button>
            <span>/</span>
            <span>{project.code}</span>
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            {project.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge>{STATUS_LABELS[project.status ?? "planning"]}</Badge>
            <Badge variant="outline">{PRIORITY_LABELS[project.priority ?? "medium"]}</Badge>
            <span className="text-sm text-muted-foreground font-mono">{project.code}</span>
          </div>
        </div>
        <Button variant="outline" onClick={() => setLocation("/projects")}>
          العودة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Details */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">تفاصيل المشروع</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {project.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">الوصف</p>
                <p className="text-sm">{project.description}</p>
              </div>
            )}
            {project.objectives && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  الأهداف
                </p>
                <p className="text-sm">{project.objectives}</p>
              </div>
            )}
            {project.budget && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{project.budget} {project.currency ?? "SAR"}</span>
              </div>
            )}
            {(project.startDate || project.endDate) && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {project.startDate ? new Date(project.startDate).toLocaleDateString("ar-SA") : "—"}
                  {" → "}
                  {project.endDate ? new Date(project.endDate).toLocaleDateString("ar-SA") : "—"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              فريق المشروع
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!team || team.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">لم يُضف أعضاء للفريق بعد</p>
            ) : (
              <div className="space-y-2">
                {team.map((member) => (
                  <div key={member.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">مستخدم #{member.userId}</p>
                      <p className="text-xs text-muted-foreground">{member.role ?? "عضو"}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{member.role ?? "عضو"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metadata */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">تاريخ الإنشاء</p>
              <p className="font-medium">{new Date(project.createdAt).toLocaleDateString("ar-SA")}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">آخر تحديث</p>
              <p className="font-medium">{new Date(project.updatedAt).toLocaleDateString("ar-SA")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
