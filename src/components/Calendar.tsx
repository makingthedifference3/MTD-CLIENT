import { useMemo, useState } from 'react';
import type { CalendarEvent, Project } from '../types/csr';

import type { SelectOption, UseProjectFiltersResult } from '../lib/projectFilters';
import ProjectFilterBar from './ProjectFilterBar';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ExternalLink, MapPin, CalendarDays } from 'lucide-react';

interface CalendarProps {
  projects: Array<Partial<Project>>;
  events: CalendarEvent[];
  projectFilters: UseProjectFiltersResult;
  brandColors?: { primary: string; gradient: string } | null;
  loading?: boolean;
  subcompanyOptions?: SelectOption[];
  selectedSubcompany?: string;
  onSubcompanyChange?: (value: string) => void;
}

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const startOfWeekSunday = (date: Date) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = base.getDay();
  base.setDate(base.getDate() - day);
  return base;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const toISO = (date: Date) => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseISODate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

export default function Calendar({
  projects,
  events,
  projectFilters,
  brandColors,
  loading,
  subcompanyOptions,
  selectedSubcompany,
  onSubcompanyChange,
}: CalendarProps) {
  const [activeMonth, setActiveMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDayISO, setSelectedDayISO] = useState<string | null>(null);
  const [eventsOpen, setEventsOpen] = useState(false);

  const singleProjectSelected = projectFilters.selectedProjectGroup !== 'all' && projectFilters.filteredProjects.length === 1;
  const currentProjectName = singleProjectSelected ? projectFilters.filteredProjects[0].name : null;

  const projectsById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);

  const visibleEvents = useMemo(() => {
    return events.filter((event) => projectFilters.visibleProjectIds.includes(event.project_id));
  }, [events, projectFilters.visibleProjectIds]);

  const eventColorPalette = useMemo(
    () => [
      { background: '#dcfce7', text: '#166534', ring: '#22c55e' },
      { background: '#e0f2fe', text: '#0f172a', ring: '#0ea5e9' },
      { background: '#ede9fe', text: '#312e81', ring: '#6366f1' },
      { background: '#cffafe', text: '#0c4a6e', ring: '#0891b2' },
      { background: '#fef9c3', text: '#78350f', ring: '#f59e0b' },
      { background: '#ecfccb', text: '#365314', ring: '#65a30d' },
      { background: '#e0f7ff', text: '#0c4a6e', ring: '#22d3ee' },
    ],
    []
  );

  const eventTitleColorMap = useMemo(() => {
    const map = new Map<string, { background: string; text: string; ring: string }>();
    let index = 0;

    for (const ev of visibleEvents) {
      const raw = (ev.title ?? '').trim();
      const key = raw ? raw.toLowerCase() : ev.id;
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, eventColorPalette[index % eventColorPalette.length]);
        index += 1;
      }
    }

    return map;
  }, [visibleEvents, eventColorPalette]);

  const getEventColor = (ev: CalendarEvent) => {
    const raw = (ev.title ?? '').trim();
    const key = raw ? raw.toLowerCase() : ev.id;
    return eventTitleColorMap.get(key) ?? eventColorPalette[0];
  };

  const eventsByDay = useMemo(() => {
    const byDay = new Map<string, CalendarEvent[]>();

    const push = (iso: string, ev: CalendarEvent) => {
      const list = byDay.get(iso) ?? [];
      list.push(ev);
      byDay.set(iso, list);
    };

    for (const ev of visibleEvents) {
      const start = parseISODate(ev.start_date) ?? parseISODate(ev.event_date) ?? null;
      const end = parseISODate(ev.end_date) ?? start;
      if (!start || !end) continue;

      const startTime = start.getTime();
      const endTime = end.getTime();
      const forward = endTime >= startTime;
      const first = forward ? start : end;
      const last = forward ? end : start;

      const maxDays = 370;
      let cursor = new Date(first);
      let safety = 0;
      while (cursor.getTime() <= last.getTime() && safety < maxDays) {
        push(toISO(cursor), ev);
        cursor = addDays(cursor, 1);
        safety += 1;
      }
    }

    // stable ordering by title
    for (const [key, list] of byDay.entries()) {
      byDay.set(
        key,
        list.slice().sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
      );
    }

    return byDay;
  }, [visibleEvents]);

  const monthLabel = useMemo(
    () => activeMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    [activeMonth]
  );

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(activeMonth);
    const monthEnd = endOfMonth(activeMonth);
    const gridStart = startOfWeekSunday(monthStart);
    const gridEnd = addDays(startOfWeekSunday(addDays(monthEnd, 6)), 6);

    const days: Array<{ date: Date; inMonth: boolean; iso: string }> = [];
    let cursor = new Date(gridStart);
    let safety = 0;
    while (cursor.getTime() <= gridEnd.getTime() && safety < 60) {
      days.push({
        date: new Date(cursor),
        inMonth: cursor.getMonth() === activeMonth.getMonth(),
        iso: toISO(cursor),
      });
      cursor = addDays(cursor, 1);
      safety += 1;
    }

    // ensure 6 rows (42 cells)
    if (days.length < 42) {
      let tail = addDays(days[days.length - 1]?.date ?? gridStart, 1);
      while (days.length < 42) {
        days.push({ date: tail, inMonth: tail.getMonth() === activeMonth.getMonth(), iso: toISO(tail) });
        tail = addDays(tail, 1);
      }
    }

    return days.slice(0, 42);
  }, [activeMonth]);

  const todayISO = toISO(new Date());

  const selectedDayEvents = useMemo(() => {
    if (!selectedDayISO) return [] as CalendarEvent[];
    return eventsByDay.get(selectedDayISO) ?? [];
  }, [eventsByDay, selectedDayISO]);

  const selectedDayLabel = useMemo(() => {
    if (!selectedDayISO) return null;
    const parsed = parseISODate(selectedDayISO);
    if (!parsed) return null;
    return {
      day: parsed.getDate(),
      monthYear: parsed.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      full: parsed.toLocaleDateString('en-GB'),
    };
  }, [selectedDayISO]);

  const openDayModal = (iso: string) => {
    const dayEvents = eventsByDay.get(iso) ?? [];
    if (!dayEvents.length) return;
    setSelectedDayISO(iso);
    setEventsOpen(true);
  };

  const formatDateRange = (event: CalendarEvent) => {
    const start = parseISODate(event.start_date) ?? parseISODate(event.event_date) ?? null;
    const end = parseISODate(event.end_date) ?? start;
    if (!start) return null;
    const startLabel = start.toLocaleDateString('en-GB');
    const endLabel = end ? end.toLocaleDateString('en-GB') : startLabel;
    return `${startLabel} - ${endLabel}`;
  };

  return (
    <div className="flex-1 bg-background overflow-auto">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            {currentProjectName ? `🗓️ ${currentProjectName}` : '🗓️ Project Events'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {currentProjectName ? 'View and manage project events in calendar view' : 'View and manage all project events in calendar view'}
          </p>
        </div>

        <ProjectFilterBar
          brandColors={brandColors ?? undefined}
          projectGroupOptions={projectFilters.projectGroupOptions}
          selectedProjectGroup={projectFilters.selectedProjectGroup}
          onProjectGroupChange={projectFilters.setSelectedProjectGroup}
          states={projectFilters.states}
          selectedState={projectFilters.selectedState}
          onStateChange={projectFilters.setSelectedState}
          subcompanyOptions={subcompanyOptions}
          selectedSubcompany={selectedSubcompany}
          onSubcompanyChange={onSubcompanyChange}
          resetFilters={projectFilters.resetFilters}
        />

        <Card className="border border-border rounded-2xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  aria-label="Previous month"
                >
                  ‹
                </Button>
                <h2 className="text-2xl font-bold text-foreground">{monthLabel}</h2>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setActiveMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  aria-label="Next month"
                >
                  ›
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  const now = new Date();
                  setActiveMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                }}
              >
                Today
              </Button>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-border">
              <div className="grid grid-cols-7 bg-muted/30">
                {['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((label) => (
                  <div key={label} className="px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-r last:border-r-0 border-border">
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const dayEvents = eventsByDay.get(day.iso) ?? [];
                  const isToday = day.iso === todayISO;
                  const isClickable = dayEvents.length > 0;

                  return (
                    <div
                      key={day.iso}
                      className={`min-h-[110px] border-r border-b border-border last:border-r-0 p-3 ${
                        day.inMonth ? 'bg-background' : 'bg-muted/20'
                      } ${isClickable ? 'cursor-pointer hover:bg-accent/30 transition-colors' : ''}`}
                      role={isClickable ? 'button' : undefined}
                      tabIndex={isClickable ? 0 : -1}
                      onClick={() => openDayModal(day.iso)}
                      onKeyDown={(e) => {
                        if (!isClickable) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openDayModal(day.iso);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${day.inMonth ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {day.date.getDate()}
                        </span>
                        {isToday && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground">Today</span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        {dayEvents.map((ev) => {
                          const eventColor = getEventColor(ev);
                          const tooltip = [
                            ev.title,
                            ev.description,
                            ev.venue,
                            ev.location,
                          ]
                            .filter(Boolean)
                            .join(' • ');

                          return (
                            <div
                              key={`${day.iso}-${ev.id}`}
                              title={tooltip}
                              className="w-full rounded-md px-2 py-1 text-xs font-semibold truncate"
                              style={{
                                backgroundColor: eventColor.background,
                                color: eventColor.text,
                                border: `1px solid ${eventColor.ring}`,
                              }}
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDayModal(day.iso);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  openDayModal(day.iso);
                                }
                              }}
                            >
                              {ev.title}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {loading && (
              <div className="mt-6 p-4 text-center text-sm font-semibold text-muted-foreground">
                Loading events...
              </div>
            )}

            {!loading && visibleEvents.length === 0 && (
              <div className="mt-6 p-4 text-center text-sm font-semibold text-muted-foreground">
                No events found for the selected criteria.
              </div>
            )}
          </div>
        </Card>

        <Dialog
          open={eventsOpen}
          onOpenChange={(open) => {
            setEventsOpen(open);
            if (!open) {
              setSelectedDayISO(null);
            }
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="text-2xl font-bold text-foreground leading-none">
                    {selectedDayLabel?.day ?? ''}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold">{selectedDayLabel?.monthYear ?? 'Project Events'}</DialogTitle>
                    <DialogDescription>
                      {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} scheduled
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {selectedDayEvents.map((ev) => {
                const eventColor = getEventColor(ev);
                const dateRange = formatDateRange(ev);
                const venue = ev.venue || ev.location;
                const project = projectsById.get(ev.project_id);
                return (
                  <div
                    key={ev.id}
                    className="rounded-2xl border bg-card p-5 shadow-sm"
                    style={{ borderColor: eventColor.ring }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-9 w-9 rounded-xl flex items-center justify-center"
                            style={{
                              backgroundColor: eventColor.background,
                              color: eventColor.text,
                              border: `1px solid ${eventColor.ring}`,
                            }}
                          >
                            <CalendarDays className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-lg font-bold text-foreground truncate">{ev.title}</p>
                            {dateRange && (
                              <p className="text-xs text-muted-foreground font-semibold">{dateRange}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {ev.itenary_url && (
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => window.open(ev.itenary_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Itenary PDF
                        </Button>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {project && (
                        <div className="space-y-1">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Project</p>
                          <p className="text-foreground font-semibold">
                            {project.name}
                            {project.code ? ` • ${project.code}` : ''}
                          </p>
                        </div>
                      )}

                      {venue && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Location</p>
                            <p className="text-foreground font-semibold">{venue}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {project?.description && (
                      <div className="mt-4">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Project description</p>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-1">{project.description}</p>
                      </div>
                    )}

                    {ev.description && (
                      <div className="mt-4">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Event description</p>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-1">{ev.description}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
