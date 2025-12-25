import type {
  Project,
  ProjectImpactMetric,
  ProjectImpactMetricRow,
  Timeline,
  Report,
  RealTimeUpdate,
  Media,
  Article,
  CalendarEvent,
  Expense
} from '../types/csr';

interface ProjectMetricValue {
  current: number;
  target: number;
}

interface ProjectRow {
  id: string;
  csr_partner_id: string | null;
  name: string | null;
  project_code?: string | null;
  description?: string | null;
  status?: string | null;
  location?: string | null;
  state?: string | null;
  city?: string | null;
  start_date?: string | null;
  expected_end_date?: string | null;
  actual_end_date?: string | null;
  total_budget?: number | null;
  approved_budget?: number | null;
  utilized_budget?: number | null;
  pending_budget?: number | null;
  beneficiaries_reached?: number | null;
  total_beneficiaries?: number | null;
  direct_beneficiaries?: number | null;
  indirect_beneficiaries?: number | null;
  male_beneficiaries?: number | null;
  female_beneficiaries?: number | null;
  children_beneficiaries?: number | null;
  pads_distributed?: number | null;
  trees_planted?: number | null;
  meals_served?: number | null;
  students_enrolled?: number | null;
  schools_renovated?: number | null;
  project_metrics?: Record<string, ProjectMetricValue> | null;
  targets?: Record<string, number> | null;
  achievements?: Record<string, number> | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  toll_id?: string | null;
  parent_project_id?: string | null;
  is_beneficiary_project?: boolean | null;
  beneficiary_name?: string | null;
}

interface TimelineRow {
  id: string;
  project_id: string | null;
  title?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  actual_start_date?: string | null;
  actual_end_date?: string | null;
  completion_percentage?: number | null;
  category?: string | null;
  status?: string | null;
  is_critical_path?: boolean | null;
  color?: string | null;
}

interface ReportRow {
  id: string;
  project_id: string | null;
  title?: string | null;
  report_code?: string | null;
  description?: string | null;
  period_from?: string | null;
  period_to?: string | null;
  report_drive_link?: string | null;
  generated_date?: string | null;
  submitted_date?: string | null;
  approved_date?: string | null;
  sent_date?: string | null;
  publication_date?: string | null;
  data?: Record<string, unknown> | null;
  charts?: Record<string, unknown> | null;
  metrics?: Record<string, unknown> | null;
  is_public?: boolean | null;
  is_sent_to_client?: boolean | null;
}

interface UpdateRow {
  id: string;
  project_id: string | null;
  title?: string | null;
  description?: string | null;
  date?: string | null;
  drive_link?: string | null;
  documents?: { drive_link?: string } | null;
  is_downloadable?: boolean | null;
  beneficiaries_count?: number | null;
  is_public?: boolean | null;
  pdf_url?: string | null;
  update_no?: string | null;
  update_type?: string | null;
  location?: string | null;
  is_sent_to_client?: boolean | null;
  is_featured?: boolean | null;
}

interface MediaArticleRow {
  id: string;
  project_id: string | null;
  title?: string | null;
  description?: string | null;
  media_type?: string | null;
  category?: string | null;
  news_channel?: string | null;
  drive_link?: string | null;
  drive_folder_link?: string | null;
  article_url?: string | null;
  thumbnail_link?: string | null;
  is_geo_tagged?: boolean | null;
  captured_at?: string | null;
  date?: string | null;
  event_date?: string | null;
  is_featured?: boolean | null;
  is_downloadable?: boolean | null;
  update_id?: string | null;
  update_title?: string | null;
  publication_date?: string | null;
  created_at?: string | null;
}

interface CalendarEventRow {
  id: string;
  project_id: string | null;
  title?: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  event_date?: string | null;
  event_type?: string | null;
  location?: string | null;
  venue?: string | null;
  itenary_url?: string | null;
}

interface ExpenseRow {
  id: string;
  project_id: string | null;
  total_amount?: number | null;
  amount?: number | null;
  status?: string | null;
  expense_date?: string | null;
}

const toISODate = (input?: string | null) => {
  if (!input) return new Date().toISOString().slice(0, 10);
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10);
};

const toNullableISODate = (input?: string | null) => {
  if (!input) return undefined;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
};

const safeString = (value?: string | null, fallback = '') => value ?? fallback;

const safeNumber = (value?: number | null, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const notNull = <T,>(value: T | null): value is T => value !== null;

const normalizeMetricKey = (label?: string | null) => {
  if (!label) return '';
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const buildImpactMetrics = (rows: ProjectImpactMetricRow[]): ProjectImpactMetric[] =>
  rows
    .map((row): ProjectImpactMetric | null => {
      if (!row.project_id) return null;
      const name = safeString(row.metric_name, 'Metric');
      const key = normalizeMetricKey(name);
      if (!key) return null;
      const progress = typeof row.progress_percentage === 'number' && Number.isFinite(row.progress_percentage)
        ? row.progress_percentage
        : undefined;
      return {
        id: row.id,
        project_id: row.project_id,
        key,
        metric_name: name,
        metric_description: row.metric_description ?? undefined,
        category: row.category ?? undefined,
        unit_of_measurement: row.unit_of_measurement ?? undefined,
        metric_type: row.metric_type ?? undefined,
        target_value: safeNumber(row.target_value),
        achieved_value: safeNumber(row.achieved_value),
        progress_percentage: progress,
        target_date: row.target_date ?? undefined,
        start_date: row.start_date ?? undefined,
        last_updated_date: row.last_updated_date ?? undefined,
      };
    })
    .filter(notNull);

const buildProjectMetrics = (
  row: ProjectRow,
  impactMetrics: ProjectImpactMetric[] = []
): Project['project_metrics'] => {
  const metrics: Project['project_metrics'] = {};
  
  // First, build from targets/achievements JSONB columns (legacy support)
  const targets = row.targets ?? {};
  const achievements = row.achievements ?? {};
  const legacyKeys = new Set([
    ...Object.keys(targets),
    ...Object.keys(achievements),
  ]);

  legacyKeys.forEach((key) => {
    metrics[key] = {
      current: safeNumber(achievements?.[key]),
      target: safeNumber(targets?.[key]),
    };
  });
  
  // Then, merge with project_metrics JSONB column (if exists)
  if (row.project_metrics) {
    Object.entries(row.project_metrics).forEach(([key, value]) => {
      metrics[key] = {
        current: safeNumber(value?.current),
        target: safeNumber(value?.target),
      };
    });
  }
  
  // Finally, add metrics from dedicated columns (these take priority)
  const columnMetrics: Record<string, number | null | undefined> = {
    pads_distributed: row.pads_distributed,
    trees_planted: row.trees_planted,
    meals_served: row.meals_served,
    students_enrolled: row.students_enrolled,
    schools_renovated: row.schools_renovated,
  };
  
  Object.entries(columnMetrics).forEach(([key, value]) => {
    const currentValue = safeNumber(value);
    if (currentValue > 0 || metrics[key]) {
      if (!metrics[key]) {
        metrics[key] = { current: 0, target: 0 };
      }
      if (currentValue > 0) {
        metrics[key].current = currentValue;
      }
      if (metrics[key].target === 0 && metrics[key].current > 0) {
        metrics[key].target = metrics[key].current;
      }
    }
  });

  impactMetrics.forEach((metric) => {
    if (!metric.key) return;
    if (!metrics[metric.key]) {
      metrics[metric.key] = { current: 0, target: 0 };
    }
    metrics[metric.key].current += safeNumber(metric.achieved_value);
    metrics[metric.key].target += safeNumber(metric.target_value);
  });

  return Object.keys(metrics).length ? metrics : undefined;
};
 
export const mapProjects = (
  rows: ProjectRow[],
  impactMetricsByProject: Record<string, ProjectImpactMetricRow[]> = {}
): Project[] =>
  rows
    .filter((row) => row.id && row.csr_partner_id && row.name)
    .map((row) => {
      const impactRows = buildImpactMetrics(impactMetricsByProject[row.id] ?? []);
      return {
        id: row.id,
        csr_partner_id: row.csr_partner_id as string,
        name: row.name ?? 'Untitled Project',
        code: safeString(row.project_code, row.id.slice(0, 8)),
        description: row.description ?? undefined,
        status: safeString(row.status, 'active'),
        location: row.location ?? row.city ?? undefined,
        state: row.state ?? undefined,
        start_date: toISODate(row.start_date ?? row.created_at ?? undefined),
        end_date: row.actual_end_date ? toISODate(row.actual_end_date) : row.expected_end_date ? toISODate(row.expected_end_date) : undefined,
        total_budget: safeNumber(row.total_budget ?? row.approved_budget ?? row.pending_budget),
        utilized_budget: safeNumber(row.utilized_budget),
        beneficiaries_current: safeNumber(row.beneficiaries_reached ?? row.direct_beneficiaries),
        beneficiaries_target: safeNumber(row.total_beneficiaries ?? row.indirect_beneficiaries),
        direct_beneficiaries: safeNumber(row.direct_beneficiaries),
        indirect_beneficiaries: safeNumber(row.indirect_beneficiaries),
        male_beneficiaries: safeNumber(row.male_beneficiaries),
        female_beneficiaries: safeNumber(row.female_beneficiaries),
        children_beneficiaries: safeNumber(row.children_beneficiaries),
        pads_distributed: safeNumber(row.pads_distributed),
        trees_planted: safeNumber(row.trees_planted),
        meals_served: safeNumber(row.meals_served),
        students_enrolled: safeNumber(row.students_enrolled),
        schools_renovated: safeNumber(row.schools_renovated),
        project_metrics: buildProjectMetrics(row, impactRows),
        impact_metrics: impactRows.length ? impactRows : undefined,
        targets: row.targets ?? undefined,
        achievements: row.achievements ?? undefined,
        toll_id: row.toll_id ?? undefined,
        parent_project_id: row.parent_project_id ?? undefined,
        is_beneficiary_project: row.is_beneficiary_project ?? false,
        beneficiary_name: row.beneficiary_name ?? undefined,
      };
    });

export const mapTimelines = (rows: TimelineRow[]): Timeline[] =>
  rows
    .filter((row) => row.id && row.project_id)
    .map((row) => {
      const completion = safeNumber(row.completion_percentage, 0);
      const color = row.color
        ?? (completion >= 100
          ? '#10b981'
          : row.status === 'completed'
          ? '#10b981'
          : '#8b5cf6');

      const normalizedStart = row.start_date ?? row.actual_start_date;
      const normalizedEnd = row.end_date ?? row.actual_end_date;

      return {
        id: row.id,
        project_id: row.project_id as string,
        title: safeString(row.title, 'Timeline Phase'),
        start_date: toNullableISODate(normalizedStart) ?? undefined,
        end_date: toNullableISODate(normalizedEnd ?? normalizedStart) ?? undefined,
        completion_percentage: completion,
        is_critical_path: Boolean(row.is_critical_path),
        color,
        status: row.status ?? undefined,
        actual_start_date: toNullableISODate(row.actual_start_date),
        actual_end_date: toNullableISODate(row.actual_end_date),
      };
    });

export const mapReports = (rows: ReportRow[]): Report[] =>
  rows
    .filter((row) => row.id && row.project_id)
    .map((row) => {
      const rawDate =
        row.publication_date
        ?? row.generated_date
        ?? row.submitted_date
        ?? row.approved_date
        ?? row.sent_date
        ?? row.period_to
        ?? row.period_from;

      return {
        id: row.id,
        project_id: row.project_id as string,
        title: safeString(row.title, row.report_code ?? 'Report'),
        date: rawDate ? toNullableISODate(rawDate) : undefined,
        drive_link: row.report_drive_link ?? undefined,
        source: 'report',
      };
    });

export const mapUpdates = (rows: UpdateRow[]): RealTimeUpdate[] =>
  rows
    .filter((row) => row.id && row.project_id)
    .map((row) => {
      const fallbackTitle = row.update_no ? `Update ${row.update_no}` : 'Field Update';
      const resolvedLink = row.pdf_url ?? row.drive_link ?? row.documents?.drive_link ?? undefined;
      const hasDownloadLink = Boolean(resolvedLink);
      return {
        id: row.id,
        project_id: row.project_id as string,
        title: safeString(row.title, fallbackTitle),
        date: toISODate(row.date),
        description: row.description ?? '',
        drive_link: resolvedLink ?? undefined,
        is_downloadable: hasDownloadLink || Boolean(row.is_downloadable) || Boolean(row.is_public),
        source: 'update',
        update_no: row.update_no ?? undefined,
        location: row.location ?? undefined,
        update_type: row.update_type ?? undefined,
        is_public: row.is_public ?? undefined,
        is_sent_to_client: row.is_sent_to_client ?? undefined,
        is_featured: row.is_featured ?? undefined,
      };
    });

export const splitMediaArticles = (rows: MediaArticleRow[]): {
  media: Media[];
  articles: Article[];
} => {
  const media: Media[] = [];
  const articles: Article[] = [];

  rows.forEach((row) => {
    const mediaType = row.media_type?.toLowerCase();
    const mediaDate = toNullableISODate(row.created_at);
    const articleDate = toNullableISODate(row.publication_date);
    const title = safeString(row.title, 'Media Asset');
    const description = typeof row.description === 'string' ? row.description : undefined;

    const normalizedCategory = row.category?.trim().toLowerCase();
    const isNewsArticleCategory = normalizedCategory === 'news article';

    // Articles: newspaper_cutting, article, document, report, pdf, certificate, or tagged as news articles
    const isArticleType = mediaType === 'newspaper_cutting'
      || mediaType === 'article'
      || mediaType === 'document'
      || mediaType === 'report'
      || mediaType === 'pdf'
      || mediaType === 'certificate'
      || isNewsArticleCategory;

    // Media: photo, image, video only
    const isMediaType = mediaType === 'photo' || mediaType === 'image' || mediaType === 'video';
    const shouldIncludeInMedia = isMediaType && !isNewsArticleCategory;

    if (shouldIncludeInMedia) {
      media.push({
        id: row.id,
        project_id: row.project_id as string,
        title,
        description,
        type: mediaType === 'video' ? 'video' : 'photo',
        date: mediaDate,
        is_geo_tagged: Boolean(row.is_geo_tagged),
        drive_link: row.drive_link || row.drive_folder_link || '',
        news_channel: row.news_channel ?? undefined,
        update_id: row.update_id ?? undefined,
        update_title: row.update_title ?? undefined,
      });
    }

    if (isArticleType) {
      articles.push({
        id: row.id,
        project_id: row.project_id as string,
        title,
        description,
        date: articleDate,
        is_featured: Boolean(row.is_featured),
        drive_link: row.article_url || row.drive_link || '',
        update_id: row.update_id ?? undefined,
        update_title: row.update_title ?? undefined,
      });
    }
  });

  return { media, articles };
};

export const mapCalendarEvents = (rows: CalendarEventRow[]): CalendarEvent[] =>
  rows
    .filter((row) => row.id && row.project_id)
    .map((row) => {
      const fallbackDate = row.event_date ?? row.start_date ?? row.end_date;
      return {
        id: row.id,
        project_id: row.project_id as string,
        title: safeString(row.title, 'Event'),
        description: row.description ?? undefined,
        start_date: toNullableISODate(row.start_date ?? fallbackDate),
        end_date: toNullableISODate(row.end_date ?? row.start_date ?? fallbackDate),
        event_date: toNullableISODate(row.event_date),
        event_type: row.event_type ?? undefined,
        location: row.location ?? undefined,
        venue: row.venue ?? undefined,
        itenary_url: row.itenary_url ?? undefined,
      };
    });

export const mapExpenses = (rows: ExpenseRow[]): Expense[] =>
  rows
    .filter((row) => row.id && row.project_id)
    .map((row) => ({
      id: row.id,
      project_id: row.project_id as string,
      total_amount: safeNumber(row.total_amount ?? row.amount),
      status: row.status ?? undefined,
      expense_date: row.expense_date ? toISODate(row.expense_date) : undefined,
    }));
