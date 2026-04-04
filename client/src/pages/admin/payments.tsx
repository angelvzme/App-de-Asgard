import AdminLayout from "@/components/layout-admin";
import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Pagos</h1>
        <p className="text-muted-foreground mt-1">Historial completo de pagos.</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-2xl">
        <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Próximamente</h3>
        <p className="text-muted-foreground text-sm max-w-xs">El historial completo de pagos estará disponible aquí. Por ahora registra los pagos desde la sección de Miembros.</p>
      </div>
    </AdminLayout>
  );
}
