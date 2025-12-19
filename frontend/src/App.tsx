import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";
import Modal from "./components/Modal";

export interface Plan {
  id: string;
  title: string;
  tag: string;
  startDate: string;
  endDate: string;
  description: string;
}

export default function App() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [modalMode, setModalMode] =
    useState<"create" | "edit" | "view">("create");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const api = axios.create({ baseURL: "http://localhost:4000/api" });

  /* LOAD */
  useEffect(() => {
    api.get("/todos").then((res) => {
      setPlans(
        res.data.map((t: any) => ({
          id: t._id,
          title: t.title,
          tag: t.tag,
          startDate: t.startDate,
          endDate: t.endDate,
          description: t.description,
        }))
      );
    });
  }, []);

  /* SORT ASC BY DEADLINE */
  const sortedPlans = useMemo(() => {
    return [...plans].sort(
      (a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
    );
  }, [plans]);

  /* CRUD */
  const handleCreate = async (data: Omit<Plan, "id">) => {
    const res = await api.post("/todos", data);
    setPlans((p) => [...p, { ...res.data, id: res.data._id }]);
  };

  const handleUpdate = async (data: Omit<Plan, "id">) => {
    if (!editingPlan) return;
    const res = await api.put(`/todos/${editingPlan.id}`, data);
    setPlans((p) =>
      p.map((x) => (x.id === editingPlan.id ? res.data : x))
    );
    setEditingPlan(null);
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/todos/${id}`);
    setPlans((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="app">
      <div className="toolbar">
        <button
          className="create-btn"
          onClick={() => {
            setEditingPlan(null);
            setModalMode("create");
            setOpen(true);
          }}
        >
          + Create
        </button>

        <div className="view-switch">
          <button
            className={viewMode === "grid" ? "active" : ""}
            onClick={() => setViewMode("grid")}
          >
            Grid
          </button>
          <button
            className={viewMode === "list" ? "active" : ""}
            onClick={() => setViewMode("list")}
          >
            List
          </button>
        </div>
      </div>

      {/* ===== LIST HEADER ===== */}
      {viewMode === "list" && (
        <div className="list-header">
          <span>Title</span>
          <span>Tag</span>
          <span>Description</span>
          <span>Actions</span>
        </div>
      )}

      <div className={`plans ${viewMode}`}>
        {sortedPlans.map((plan) => (
          <div
            key={plan.id}
            className={`plan ${viewMode}`}
            onClick={() => {
              setEditingPlan(plan);
              setModalMode("view");
              setOpen(true);
            }}
          >
            <div className="col title">{plan.title}</div>
            <div className="col tag">{plan.tag}</div>
            <div className="col desc">{plan.description}</div>

            <div className="col actions">
              <button
                className="edit"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPlan(plan);
                  setModalMode("edit");
                  setOpen(true);
                }}
              >
                Edit
              </button>
              <button
                className="delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(plan.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <Modal
          onClose={() => {
            setOpen(false);
            setEditingPlan(null);
            setModalMode("create");
          }}
          onSubmit={editingPlan ? handleUpdate : handleCreate}
          initialData={editingPlan ?? undefined}
          mode={modalMode}
          onDelete={() => editingPlan && handleDelete(editingPlan.id)}
          onEdit={() => setModalMode("edit")}
        />
      )}
    </div>
  );
}
