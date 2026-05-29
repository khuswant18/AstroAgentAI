import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "../store/useStore";
import { ChevronUp, Settings2 } from "lucide-react";
import { useState } from "react";

const birthSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string().min(1, "Date of birth is required").refine(
    (val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d < new Date();
    },
    { message: "Date must be a valid past date" }
  ),
  time: z.string().optional(),
  isTimeUnknown: z.boolean().optional(),
  place: z.string().min(1, "Place of birth is required"),
}).refine(data => data.isTimeUnknown || (data.time && /^\d{2}:\d{2}$/.test(data.time)), {
  message: "Time is required or mark as unknown",
  path: ["time"]
});

type BirthFormData = z.infer<typeof birthSchema>;

interface BirthFormProps {
  onClose?: () => void;
  isOverlay?: boolean;
}

export default function BirthForm({ onClose, isOverlay = false }: BirthFormProps) {
  const { birthDetails, setBirthDetails } = useStore();
  const [isCollapsed, setIsCollapsed] = useState(!!birthDetails);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BirthFormData>({
    resolver: zodResolver(birthSchema),
    defaultValues: birthDetails || { name: "", date: "", time: "", place: "", isTimeUnknown: false },
  });

  const isTimeUnknown = watch("isTimeUnknown");

  const onSubmit = (data: BirthFormData) => {
    if (data.isTimeUnknown) {
      data.time = "12:00";
    }
    setBirthDetails(data as any);
    setIsCollapsed(true);
    onClose?.();
  };

  const formContent = (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      id="birth-details-form"
    >
      {!isOverlay && birthDetails && (
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-[#e8e3d8] font-serif text-lg">Edit Details</h3>
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="flex items-center gap-1 text-sm text-ara-text-dim hover:text-ara-accent transition-colors"
          >
            <ChevronUp size={14} />
            Close
          </button>
        </div>
      )}

      <div>
        <label
          htmlFor="birth-name"
          className="block text-sm text-ara-text-dim mb-1.5"
        >
          Full Name
        </label>
        <input
          id="birth-name"
          type="text"
          placeholder="e.g., Aradhana Sharma"
          {...register("name")}
          className="w-full bg-ara-surface border border-ara-border rounded-lg px-4 py-2.5 text-ara-text placeholder:text-ara-text-muted focus-ring transition-all"
        />
        {errors.name && (
          <p className="text-ara-error text-xs mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="birth-date"
            className="block text-sm text-ara-text-dim mb-1.5"
          >
            Date of Birth
          </label>
          <input
            id="birth-date"
            type="date"
            {...register("date")}
            className="w-full bg-ara-surface border border-ara-border rounded-lg px-4 py-2.5 text-ara-text focus-ring transition-all [color-scheme:dark]"
          />
          {errors.date && (
            <p className="text-ara-error text-xs mt-1">
              {errors.date.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="birth-time"
            className="block text-sm text-ara-text-dim mb-1.5"
          >
            Time of Birth
          </label>
          <input
            id="birth-time"
            type="time"
            {...register("time")}
            disabled={isTimeUnknown}
            className="w-full bg-ara-surface border border-ara-border rounded-lg px-4 py-2.5 text-ara-text focus-ring transition-all [color-scheme:dark] disabled:opacity-50"
          />
          <label className="flex items-center gap-2 mt-2 text-sm text-ara-text-muted cursor-pointer">
            <input type="checkbox" {...register("isTimeUnknown")} className="rounded border-ara-border bg-ara-surface text-ara-accent focus:ring-ara-accent focus:ring-offset-ara-bg" />
            Unknown time (use 12:00 PM)
          </label>
          {errors.time && (
            <p className="text-ara-error text-xs mt-1">
              {errors.time.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="birth-place"
          className="block text-sm text-ara-text-dim mb-1.5"
        >
          Place of Birth
        </label>
        <input
          id="birth-place"
          type="text"
          placeholder="e.g., Mumbai, India"
          {...register("place")}
          className="w-full bg-ara-surface border border-ara-border rounded-lg px-4 py-2.5 text-ara-text placeholder:text-ara-text-muted focus-ring transition-all"
        />
        {errors.place && (
          <p className="text-ara-error text-xs mt-1">{errors.place.message}</p>
        )}
      </div>

      <button
        id="submit-birth-details-btn"
        type="submit"
        className="w-full bg-ara-accent text-ara-bg font-serif font-semibold py-3 rounded-lg hover:brightness-110 transition-all glow-accent"
      >
        ✨ Begin Your Journey
      </button>
    </form>
  );

  // Header profile with dropdown edit form
  if (birthDetails && !isOverlay) {
    const initial = birthDetails.name ? birthDetails.name.charAt(0).toUpperCase() : "?";
    return (
      <div className="flex items-center justify-between w-full relative">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center border border-ara-accent/30 text-ara-accent text-sm font-medium shrink-0"
            style={{ background: "linear-gradient(135deg, #2a2250, #1a1535)" }}
          >
            {initial}
          </div>
          
          {/* Name & Date */}
          <div className="flex flex-col">
            <span className="text-[14px] text-[#e8e3d8] font-serif leading-tight">
              {birthDetails.name}
            </span>
            <span className="text-[12px] text-[#6b6580] font-mono leading-tight flex items-center gap-1.5 mt-0.5">
              {birthDetails.date}
              <span>·</span>
              {birthDetails.isTimeUnknown ? "Unknown Time" : birthDetails.time}
            </span>
          </div>
        </div>

        {/* Edit Button */}
        <button
          id="edit-birth-details-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-[#6b6580] hover:text-[#f0b95b] transition-colors rounded-lg hover:bg-ara-accent/10"
        >
          <Settings2 size={16} />
        </button>

        {/* Dropdown Edit Form */}
        {!isCollapsed && (
          <div className="absolute top-[100%] right-0 mt-4 w-[calc(100vw-32px)] md:w-96 z-50 glass-surface rounded-xl p-5 animate-slide-up border border-[rgba(240,185,91,0.2)] shadow-2xl bg-[#0b0a14] backdrop-blur-xl">
            {formContent}
          </div>
        )}
      </div>
    );
  }

  // Overlay mode — fullscreen centered card
  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ara-bg/90 backdrop-blur-sm animate-fade-in">
        <div className="glass-surface rounded-2xl p-8 max-w-md w-full mx-4 animate-slide-up glow-accent">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl text-ara-accent mb-2">
              ✦ Aradhana ✦
            </h1>
            <p className="text-ara-text-dim text-sm leading-relaxed">
              Welcome, dear seeker. To illuminate the cosmic patterns woven into
              your life, I'll need the details of your birth.
            </p>
          </div>
          {formContent}
        </div>
      </div>
    );
  }

  // Inline mode
  return (
    <div className="glass-surface rounded-xl animate-slide-up">
      {formContent}
    </div>
  );
}
