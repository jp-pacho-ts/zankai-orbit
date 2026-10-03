import 'server-only';
import { z } from 'zod';
import { DEFAULT_COLUMN_TITLES } from '../../types/orbit';

const text = (max: number) => z.string().trim().min(1).max(max);
const distinct = (values: string[]) =>
  new Set(values.map((value) => value.toLowerCase())).size === values.length;

export const generateBoardRequestSchema = z.object({
  prompt: z.string().trim().min(10).max(2000),
  theme: text(40).optional(),
});

export const breakdownTaskRequestSchema = z.object({
  taskId: z.string().uuid(),
  taskTitle: text(120),
  taskDescription: z.string().trim().max(1000).optional(),
});

const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
});

export const generatedBoardSchema = z.object({
  title: text(120),
  emoji: text(32),
  colorTheme: text(40),
  tasks: z.array(z.object({
    title: text(120),
    description: z.string().trim().max(1000),
    column: z.enum(DEFAULT_COLUMN_TITLES),
    priority: z.enum(['low', 'medium', 'high']),
    checklist: z.array(text(200)).max(10).refine(distinct),
    dueDate: calendarDate.nullable(),
  })).min(1).max(30),
});

export const taskBreakdownSchema = z.object({
  subtasks: z.array(z.object({ title: text(200) })).min(3).max(6)
    .refine((steps) => distinct(steps.map((step) => step.title))),
  summary: text(1000),
});
