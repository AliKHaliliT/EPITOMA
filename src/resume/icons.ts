// Lucide icons referenced by name in the resume builder (section catalog +
// the icon picker). Keeping an explicit map avoids pulling all of lucide.

import { createElement } from "react";
import {
  AlignLeft,
  Briefcase,
  GraduationCap,
  BookOpen,
  Trophy,
  BookMarked,
  Mic2,
  Heart,
  BadgeCheck,
  Building2,
  Users,
  FolderOpen,
  Smile,
  Wrench,
  Globe,
  FileText,
  Sprout,
  PenLine,
  Puzzle,
  Star,
  Award,
  Code,
  Languages,
  Lightbulb,
  Rocket,
  Target,
  type LucideIcon,
} from "lucide-react";

export const RESUME_ICONS: Record<string, LucideIcon> = {
  AlignLeft, Briefcase, GraduationCap, BookOpen, Trophy, BookMarked, Mic2,
  Heart, BadgeCheck, Building2, Users, FolderOpen, Smile, Wrench, Globe,
  FileText, Sprout, PenLine, Puzzle, Star, Award, Code, Languages, Lightbulb,
  Rocket, Target,
};

/** Resolve an icon name to a component, falling back to Puzzle. */
export const iconByName = (name?: string): LucideIcon =>
  (name && RESUME_ICONS[name]) || Puzzle;

/** Render an icon by name: avoids assigning a component variable in render. */
export const NamedIcon = ({
  name,
  size,
  className,
}: {
  name?: string;
  size?: number;
  className?: string;
}) => createElement(iconByName(name), { size, className });

/** Names offered in the section icon picker. */
export const ICON_CHOICES = Object.keys(RESUME_ICONS);
