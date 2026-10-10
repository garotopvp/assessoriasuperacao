import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, MapPin, Plus, Trash2, Edit, Users, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RacesManager() {
  const [races, setRaces] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRegistrationsOpen, setIsRegistrationsOpen] = useState(false);
  const [selectedRace, setSelectedRace] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    event_date: "",
    location: "",
    description: "",
    image_url: "",
    registration_deadline: "",
    external_link: "",
    available_distances: "",
    available_paces: "",
    price: "0",
  });

  useEffect(() => {
    fetchRaces();
  }, []);

  const fetchRaces = async () => {
    try {
      const { data, error } = await supabase
        .from("races")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) throw error;
      setRaces(data || []);
    } catch (error) {
      toast.error("Erro ao carregar corridas");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async (raceId: string) => {
    try {
      const { data, error } = await supabase
        .from("race_registrations")
        .select(
          `
          *,
          races (title)
        `
        )
        .eq("race_id", raceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      toast.error("Erro ao carregar inscrições");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const distancesArray = formData.available_distances
        ? formData.available_distances
            .split(",")
            .map((d) => d.trim())
            .filter((d) => d !== "")
        : [];

      const submitData = {
        ...formData,
        available_distances: distancesArray,
        available_paces: formData.available_paces
          ? formData.available_paces
              .split(",")
              .map((p) => p.trim())
              .filter((p) => p !== "")
          : [],
        price: parseFloat(formData.price || "0"),
      };

      if (selectedRace) {
        const { error } = await supabase.from("races").update(submitData).eq("id", selectedRace.id);
        if (error) throw error;
        toast.success("Corrida atualizada com sucesso");
      } else {
        const { error } = await supabase.from("races").insert(submitData);
        if (error) throw error;
        toast.success("Corrida criada com sucesso");
      }
      setIsDialogOpen(false);
      fetchRaces();
      resetForm();
    } catch (error) {
      toast.error("Erro ao salvar corrida");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta corrida?")) return;
    try {
      const { error } = await supabase.from("races").delete().eq("id", id);
      if (error) throw error;
      toast.success("Corrida excluída");
      fetchRaces();
    } catch (error) {
      toast.error("Erro ao excluir corrida");
    }
  };

  const handleEdit = (race: any) => {
    setSelectedRace(race);
    setFormData({
      title: race.title,
      event_date: race.event_date,
      location: race.location || "",
      description: race.description || "",
      image_url: race.image_url || "",
      registration_deadline: race.registration_deadline || "",
      external_link: race.external_link || "",
      available_distances: race.available_distances ? race.available_distances.join(", ") : "",
      available_paces: race.available_paces ? race.available_paces.join(", ") : "",
      price: race.price?.toString() || "0",
    });
    setIsDialogOpen(true);
  };

  const handleViewRegistrations = (race: any) => {
    setSelectedRace(race);
    fetchRegistrations(race.id);
    setIsRegistrationsOpen(true);
  };

  const resetForm = () => {
    setSelectedRace(null);
    setFormData({
      title: "",
      event_date: "",
      location: "",
      description: "",
      image_url: "",
      registration_deadline: "",
      external_link: "",
      available_distances: "",
      available_paces: "",
      price: "0",
    });
  };

  const updateRegistrationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from("race_registrations").update({ status }).eq("id", id);

      if (error) throw error;
      toast.success(`Status atualizado para ${status}`);
      if (selectedRace) fetchRegistrations(selectedRace.id);
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Corridas</h2>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Nova Corrida
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedRace ? "Editar Corrida" : "Nova Corrida"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data do Evento</Label>
                  <Input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Local</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>URL da Imagem (Banner)</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prazo de Inscrição</Label>
                  <Input
                    type="date"
                    value={formData.registration_deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, registration_deadline: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link Externo (Opcional)</Label>
                  <Input
                    value={formData.external_link}
                    onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor do Kit/Inscrição (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Distâncias Dispo. (Separe por vírgulas)</Label>
                  <Input
                    value={formData.available_distances}
                    onChange={(e) =>
                      setFormData({ ...formData, available_distances: e.target.value })
                    }
                    placeholder="ex: 5km, 10km"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Paces/Pelotões (Separe por vírgulas)</Label>
                  <Input
                    value={formData.available_paces}
                    onChange={(e) => setFormData({ ...formData, available_paces: e.target.value })}
                    placeholder="ex: Sub 4:00, 4:00-4:30"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                {selectedRace ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {races.map((race) => (
          <Card key={race.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {new Date(race.event_date).toLocaleDateString()}
              </CardTitle>
              {race.external_link && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{race.title}</div>
              <p className="text-xs text-muted-foreground mb-4">{race.location}</p>
              <div className="flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={() => handleViewRegistrations(race)}>
                  <Users className="w-4 h-4 mr-2" /> Inscrições
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(race)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(race.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isRegistrationsOpen} onOpenChange={setIsRegistrationsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inscrições: {selectedRace?.title}</DialogTitle>
          </DialogHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Camiseta</TableHead>
                <TableHead>Distância</TableHead>
                <TableHead>Pace</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Nenhuma inscrição encontrada
                  </TableCell>
                </TableRow>
              ) : (
                registrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>{reg.full_name}</TableCell>
                    <TableCell>{reg.cpf}</TableCell>
                    <TableCell>
                      {reg.birth_date ? new Date(reg.birth_date).toLocaleDateString("pt-BR") : "-"}
                    </TableCell>
                    <TableCell>{reg.email}</TableCell>
                    <TableCell>{reg.tshirt_size}</TableCell>
                    <TableCell>{reg.selected_distance || "-"}</TableCell>
                    <TableCell>{reg.pace}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          reg.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : reg.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {reg.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={reg.status}
                        onValueChange={(val) => updateRegistrationStatus(reg.id, val)}
                      >
                        <SelectTrigger className="w-[100px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
