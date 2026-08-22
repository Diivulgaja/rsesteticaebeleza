(function () {
  function resolveRuntimeConfig() {
    const htmlDataset = document?.documentElement?.dataset || {};
    const metaUrl = document.querySelector('meta[name="rs-supabase-url"]')?.content || '';
    const metaAnonKey = document.querySelector('meta[name="rs-supabase-anon-key"]')?.content || '';
    const merged = Object.assign({}, window.__RS_RUNTIME_CONFIG__ || {}, window.__APP_CONFIG__ || {}, window.CONFIG || {}, window.APP_CONFIG || {});
    if (!merged.supabaseUrl && htmlDataset.supabaseUrl) merged.supabaseUrl = htmlDataset.supabaseUrl;
    if (!merged.supabaseAnonKey && htmlDataset.supabaseAnonKey) merged.supabaseAnonKey = htmlDataset.supabaseAnonKey;
    if (!merged.supabaseUrl && metaUrl) merged.supabaseUrl = metaUrl;
    if (!merged.supabaseAnonKey && metaAnonKey) merged.supabaseAnonKey = metaAnonKey;
    return merged;
  }

  const CONFIG = resolveRuntimeConfig();
  const hasSupabase = window.supabase && typeof window.supabase.createClient === 'function';
  if (!hasSupabase || !CONFIG.supabaseUrl || !CONFIG.supabaseAnonKey) return;

  function getSupabaseClient() {
    if (window.__RS_SUPABASE_CLIENT__) return window.__RS_SUPABASE_CLIENT__;

    window.__RS_SUPABASE_CLIENT__ = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    return window.__RS_SUPABASE_CLIENT__;
  }

  const supabase = getSupabaseClient();

  const state = {
    user: null,
    customer: null,
    appointments: [],
    reviewCount: 0,
    publicReviews: [],
    servicesCatalog: {},
    portalStatus: 'idle',
    portalMessage: '',
    activeView: 'appointments',
    reviewDraft: {
      tags: [],
      recommendation: null
    }
  };

  const dom = {};
  const AUTH_HASH_KEYS = ['access_token', 'refresh_token', 'expires_at', 'expires_in', 'token_type', 'provider_token', 'provider_refresh_token', 'type'];

  function hashContainsAuthTokens(hash) {
    const value = String(hash || '').replace(/^#/, '');
    if (!value) return false;
    const params = new URLSearchParams(value);
    return AUTH_HASH_KEYS.some((key) => params.has(key));
  }

  function cleanupAuthHash() {
    if (!window.history?.replaceState) return;
    if (!hashContainsAuthTokens(window.location.hash)) return;
    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  function getSafeRedirectTo() {
    return `${window.location.origin}${window.location.pathname}${window.location.search}`;
  }

  function cacheDom() {
    Object.assign(dom, {
      navShell: document.getElementById('customer-nav-shell'),
      navTrigger: document.getElementById('customer-nav-trigger'),
      navLabel: document.getElementById('customer-nav-label'),
      navAvatar: document.getElementById('customer-nav-avatar'),
      navDropdown: document.getElementById('customer-nav-dropdown'),
      navUserPreview: document.getElementById('customer-nav-user-preview'),
      navPreviewAvatar: document.getElementById('customer-nav-preview-avatar'),
      navPreviewName: document.getElementById('customer-nav-preview-name'),
      navPreviewEmail: document.getElementById('customer-nav-preview-email'),
      menuAppointments: document.getElementById('customer-menu-appointments'),
      menuReviews: document.getElementById('customer-menu-reviews'),
      menuLogout: document.getElementById('customer-menu-logout'),

      shellPendingBanner: document.getElementById('customer-shell-pending-banner'),
      shellPendingCopy: document.getElementById('customer-shell-pending-copy'),

      shell: document.getElementById('customer-shell'),
      shellBackdrop: document.getElementById('customer-shell-backdrop'),
      shellClose: document.getElementById('customer-shell-close'),
      shellTabs: Array.from(document.querySelectorAll('[data-customer-view]')),
      shellPanels: Array.from(document.querySelectorAll('[data-customer-panel]')),
      avatar: document.getElementById('customer-avatar'),
      name: document.getElementById('customer-name'),
      email: document.getElementById('customer-email'),
      statAppointments: document.getElementById('customer-stat-appointments'),
      statCompleted: document.getElementById('customer-stat-completed'),
      statReviews: document.getElementById('customer-stat-reviews'),
      appointmentsEmpty: document.getElementById('customer-appointments-empty'),
      appointmentsList: document.getElementById('customer-appointments-list'),
      publicReviews: document.getElementById('customer-public-reviews'),
      linkForm: document.getElementById('customer-link-form'),
      linkPhone: document.getElementById('customer-link-phone'),
      linkFeedback: document.getElementById('customer-link-feedback'),

      reviewModal: document.getElementById('customer-review-modal'),
      reviewForm: document.getElementById('customer-review-form'),
      reviewClose: document.getElementById('customer-review-close'),
      reviewCancel: document.getElementById('customer-review-cancel'),
      reviewService: document.getElementById('customer-review-service'),
      reviewAppointmentId: document.getElementById('customer-review-appointment-id'),
      reviewRating: document.getElementById('customer-review-rating'),
      reviewComment: document.getElementById('customer-review-comment'),
      reviewTitle: document.getElementById('customer-review-title'),
      reviewCommentCount: document.getElementById('customer-review-comment-count'),
      reviewFeedback: document.getElementById('customer-review-feedback'),
      reviewSubmit: document.getElementById('customer-review-submit'),
      reviewSuccessClose: document.getElementById('customer-review-success-close'),
      reviewRatingTitle: document.getElementById('customer-review-rating-title'),
      reviewRatingHint: document.getElementById('customer-review-rating-hint'),
      reviewRatingCaption: document.getElementById('customer-review-rating-caption'),
      reviewPreviewStars: document.getElementById('customer-review-preview-stars'),
      reviewPreviewHeadline: document.getElementById('customer-review-preview-headline'),
      reviewPreviewText: document.getElementById('customer-review-preview-text'),
      reviewPreviewTags: document.getElementById('customer-review-preview-tags'),
      reviewPreviewRecommendation: document.getElementById('customer-review-preview-recommendation'),
      reviewSuccessRating: document.getElementById('customer-review-success-rating'),
      reviewSuccessService: document.getElementById('customer-review-success-service'),
      reviewSuccessTitle: document.getElementById('customer-review-success-title-text')
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function normalizePhone(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function formatPhone(value) {
    const digits = normalizePhone(value).slice(0, 11);
    const match = digits.match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
    if (!match) return '';
    if (!match[2]) return match[1];
    return `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ''}`;
  }

  function formatDateTime(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function formatRelativeDate(value) {
    if (!value) return 'recentemente';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'recentemente';
    const diff = Date.now() - date.getTime();
    const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    if (days < 1) return 'hoje';
    if (days === 1) return 'ontem';
    if (days < 30) return `há ${days} dias`;
    if (days < 365) {
      const months = Math.max(1, Math.floor(days / 30));
      return months === 1 ? 'há 1 mês' : `há ${months} meses`;
    }
    const years = Math.max(1, Math.floor(days / 365));
    return years === 1 ? 'há 1 ano' : `há ${years} anos`;
  }

  function getStatusLabel(status) {
    return ({ pending: 'Pendente', confirmed: 'Confirmado', cancelled: 'Cancelado', expired: 'Expirado' }[status] || status || '-');
  }

  function getAttendanceLabel(status) {
    return ({ scheduled: 'Agendado', attended: 'Concluído', completed: 'Concluído', no_show: 'Faltou', cancelled: 'Cancelado' }[status] || status || '-');
  }

  function getSessionUserMeta(user) {
    const identity = user?.identities?.[0];
    return identity?.identity_data || user?.user_metadata || {};
  }

  function isSchemaActivationError(error) {
    const message = String(error?.message || error?.details || error?.hint || '').toLowerCase();
    return (
      message.includes('function') ||
      message.includes('permission denied') ||
      message.includes('not found') ||
      message.includes('does not exist') ||
      message.includes('schema cache') ||
      message.includes('rls') ||
      message.includes('row-level')
    );
  }

  function getErrorText(error) {
    return [error?.message, error?.details, error?.hint, error?.code].filter(Boolean).join(' • ');
  }

  function isMissingDbObjectError(error) {
    const normalized = getErrorText(error).toLowerCase();
    return (
      normalized.includes('does not exist') ||
      normalized.includes('could not find') ||
      normalized.includes('schema cache') ||
      normalized.includes('42p01') ||
      normalized.includes('42703')
    );
  }

  function isRecoverableRpcError(error) {
    const normalized = getErrorText(error).toLowerCase();
    return (
      isMissingDbObjectError(error) ||
      normalized.includes('pgrst202') ||
      normalized.includes('pgrst203') ||
      normalized.includes('could not choose the best candidate function') ||
      normalized.includes('function overloading can be resolved') ||
      normalized.includes('multiple choices') ||
      normalized.includes('ambiguous')
    );
  }

  function sortAppointmentsDescending(list) {
    return [...(list || [])].sort((left, right) => {
      const a = new Date(right?.start_at || right?.created_at || 0).getTime();
      const b = new Date(left?.start_at || left?.created_at || 0).getTime();
      return (Number.isNaN(a) ? 0 : a) - (Number.isNaN(b) ? 0 : b);
    });
  }

  function getDisplayName() {
    const meta = getSessionUserMeta(state.user);
    return state.customer?.full_name || meta.full_name || meta.name || 'Cliente';
  }

  function getAvatarUrl() {
    const meta = getSessionUserMeta(state.user);
    return state.customer?.avatar_url || meta.avatar_url || 'https://placehold.co/160x160/png';
  }

  const REVIEW_GUIDANCE = {
    0: {
      title: 'Escolha sua nota com calma',
      hint: 'Depois das estrelas, você pode destacar o que mais gostou antes de enviar.',
      caption: 'Sua experiência será refletida na forma como outras clientes enxergam o atendimento.',
      preview: 'Selecione sua nota e, se quiser, complemente com o que mais gostou no atendimento.'
    },
    1: {
      title: 'Vamos entender o que faltou',
      hint: 'Se algo não saiu como esperado, nos conte com sinceridade para ajudar a melhorar.',
      caption: 'Avaliações honestas ajudam a equipe a evoluir em cada detalhe.',
      preview: 'A cliente relatou pontos de atenção sobre a experiência.'
    },
    2: {
      title: 'Ainda podemos melhorar',
      hint: 'Conte o que poderia ter sido diferente para deixar essa experiência mais alinhada ao esperado.',
      caption: 'Seu olhar ajuda a corrigir ajustes finos no atendimento.',
      preview: 'A experiência teve bons pontos, mas ainda deixou espaço para melhorias.'
    },
    3: {
      title: 'Uma boa experiência, com espaço para lapidar',
      hint: 'Marque os pontos positivos e complemente com o que faria a experiência ficar ainda melhor.',
      caption: 'Esse tipo de retorno ajuda a transformar um bom atendimento em memorável.',
      preview: 'A cliente descreveu uma experiência positiva, com observações construtivas.'
    },
    4: {
      title: 'Quase impecável',
      hint: 'Destaque o que mais brilhou no atendimento para valorizar a experiência.',
      caption: 'Seu depoimento mostra o que faz essa experiência valer a recomendação.',
      preview: 'A cliente teve uma experiência muito positiva e destacada.'
    },
    5: {
      title: 'Uma experiência digna de destaque',
      hint: 'Agora vale registrar os detalhes que fariam você recomendar esse atendimento sem pensar duas vezes.',
      caption: 'Um depoimento completo reforça a confiança de quem está escolhendo pela primeira vez.',
      preview: 'A cliente descreveu uma experiência excelente e recomendaria o atendimento.'
    }
  };

  function getReviewGuidance(rating) {
    return REVIEW_GUIDANCE[rating] || REVIEW_GUIDANCE[0];
  }

  function getSelectedReviewTags() {
    return Array.from(document.querySelectorAll('[data-review-tag].is-selected'))
      .map((button) => button.dataset.reviewTag)
      .filter(Boolean);
  }

  function getReviewRecommendation() {
    const selected = document.querySelector('[data-review-recommend].is-selected');
    return selected ? selected.dataset.reviewRecommend : null;
  }

  function setReviewFeedback(message, tone = 'error') {
    if (!dom.reviewFeedback) return;
    if (!message) {
      dom.reviewFeedback.className = 'customer-review-feedback hidden';
      dom.reviewFeedback.textContent = '';
      return;
    }
    dom.reviewFeedback.textContent = message;
    dom.reviewFeedback.className = `customer-review-feedback customer-review-feedback--${tone}`;
  }

  function formatReviewError(error) {
    const parts = [error?.message, error?.details, error?.hint].filter(Boolean);
    const raw = parts.join(' • ').trim();
    if (!raw) return 'Não foi possível enviar a avaliação agora.';

    const normalized = raw.toLowerCase();
    if (normalized.includes('não autenticado') || normalized.includes('jwt')) {
      return 'Sua sessão expirou. Entre novamente para enviar sua avaliação.';
    }
    if (normalized.includes('cliente não encontrado')) {
      return 'Seu perfil ainda não foi sincronizado por completo. Entre novamente ou vincule o WhatsApp do agendamento.';
    }
    if (normalized.includes('agendamento não encontrado')) {
      return 'Não encontramos esse atendimento para avaliação.';
    }
    if (normalized.includes('não pode avaliar')) {
      return 'Este atendimento não está vinculado à sua conta atual.';
    }
    if (normalized.includes('ainda não liberada')) {
      return 'A avaliação deste atendimento ainda não foi liberada pela equipe.';
    }
    if (normalized.includes('já foi avaliado')) {
      return 'Este atendimento já possui uma avaliação enviada.';
    }
    if (normalized.includes('row-level') || normalized.includes('permission') || normalized.includes('rls') || normalized.includes('schema cache') || normalized.includes('function') || normalized.includes('42p01') || normalized.includes('42703') || normalized.includes('pgrst202') || normalized.includes('pgrst203') || normalized.includes('does not exist') || normalized.includes('best candidate function')) {
      return 'O banco ainda está com funções duplicadas ou permissões antigas. Rode o SQL de limpeza desta versão no Supabase.';
    }

    return raw;
  }

  function buildReviewHeadline(rating, title) {
    if (title) return title;
    if (rating >= 5) return 'Experiência excelente e memorável';
    if (rating === 4) return 'Atendimento muito acima do esperado';
    if (rating === 3) return 'Boa experiência, com espaço para lapidar';
    if (rating === 2) return 'Pontos positivos, mas ainda com ajustes';
    if (rating === 1) return 'A experiência ficou abaixo do esperado';
    return 'Assim sua experiência será exibida';
  }

  function buildReviewPreviewText(rating, comment, tags, recommendation) {
    if (comment) return comment;
    const guidance = getReviewGuidance(rating);
    const tagText = tags.length ? ` Destaques citados: ${tags.join(', ')}.` : '';
    const recommendText = recommendation === 'yes'
      ? ' Recomendaria esse atendimento com segurança.'
      : recommendation === 'maybe'
        ? ' Talvez recomendasse, dependendo do que a cliente procura.'
        : recommendation === 'no'
          ? ' Ainda não recomendaria este atendimento.'
          : '';
    return `${guidance.preview}${tagText}${recommendText}`.trim();
  }

  function updateReviewComposer() {
    const rating = Number(dom.reviewRating?.value || 0);
    const title = dom.reviewTitle?.value?.trim() || '';
    const comment = dom.reviewComment?.value?.trim() || '';
    const tags = getSelectedReviewTags();
    const recommendation = getReviewRecommendation();
    state.reviewDraft = { tags, recommendation };

    const guidance = getReviewGuidance(rating);
    if (dom.reviewRatingTitle) dom.reviewRatingTitle.textContent = guidance.title;
    if (dom.reviewRatingHint) dom.reviewRatingHint.textContent = guidance.hint;
    if (dom.reviewRatingCaption) dom.reviewRatingCaption.textContent = guidance.caption;

    if (dom.reviewPreviewStars) {
      dom.reviewPreviewStars.textContent = rating > 0
        ? `${'★'.repeat(rating)}${'☆'.repeat(Math.max(0, 5 - rating))}`
        : '☆☆☆☆☆';
    }

    if (dom.reviewPreviewHeadline) {
      dom.reviewPreviewHeadline.textContent = buildReviewHeadline(rating, title);
    }

    if (dom.reviewPreviewText) {
      dom.reviewPreviewText.textContent = buildReviewPreviewText(rating, comment, tags, recommendation);
    }

    if (dom.reviewCommentCount) {
      const length = comment.length;
      dom.reviewCommentCount.textContent = `${length}/420`;
    }

    if (dom.reviewPreviewTags) {
      if (tags.length) {
        dom.reviewPreviewTags.classList.remove('hidden');
        dom.reviewPreviewTags.innerHTML = tags.map((tag) => `<span class="customer-review-preview-tag">${escapeHtml(tag)}</span>`).join('');
      } else {
        dom.reviewPreviewTags.classList.add('hidden');
        dom.reviewPreviewTags.innerHTML = '';
      }
    }

    if (dom.reviewPreviewRecommendation) {
      if (recommendation) {
        dom.reviewPreviewRecommendation.classList.remove('hidden');
        dom.reviewPreviewRecommendation.textContent = recommendation === 'yes'
          ? 'Recomendação: Sim, eu indicaria esse atendimento.'
          : recommendation === 'maybe'
            ? 'Recomendação: Talvez, dependendo do perfil da cliente.'
            : 'Recomendação: Ainda não recomendaria este atendimento.';
      } else {
        dom.reviewPreviewRecommendation.classList.add('hidden');
        dom.reviewPreviewRecommendation.textContent = '';
      }
    }
  }

  function resetReviewComposer() {
    state.reviewDraft = { tags: [], recommendation: null };
    document.querySelectorAll('[data-review-tag].is-selected').forEach((button) => button.classList.remove('is-selected'));
    document.querySelectorAll('[data-review-recommend].is-selected').forEach((button) => button.classList.remove('is-selected'));
    if (dom.reviewComment) dom.reviewComment.value = '';
    if (dom.reviewTitle) dom.reviewTitle.value = '';
    setReviewFeedback('');
    setStarRating(0);
    updateReviewComposer();
  }

  function toggleReviewTag(button) {
    button.classList.toggle('is-selected');
    updateReviewComposer();
  }

  function setReviewRecommendation(value) {
    document.querySelectorAll('[data-review-recommend]').forEach((button) => {
      button.classList.toggle('is-selected', button.dataset.reviewRecommend === value);
    });
    updateReviewComposer();
  }

  function buildReviewCommentPayload(rating, comment, tags, recommendation) {
    const chunks = [];
    if (comment) chunks.push(comment);
    if (tags.length) chunks.push(`Destaques: ${tags.join(', ')}.`);
    if (recommendation === 'yes') chunks.push('Eu recomendaria este atendimento.');
    if (recommendation === 'no') chunks.push('Ainda não recomendaria este atendimento.');
    if (!chunks.length) chunks.push(buildReviewPreviewText(rating, '', tags, recommendation));
    return chunks.join(' ').trim();
  }

  function buildFallbackCustomer() {
    if (!state.user) return null;
    const meta = getSessionUserMeta(state.user);
    return {
      auth_user_id: state.user.id,
      full_name: meta.full_name || meta.name || state.user.user_metadata?.full_name || 'Cliente',
      email: state.user.email || meta.email || '',
      phone: null,
      avatar_url: meta.avatar_url || state.user.user_metadata?.avatar_url || '',
      auth_provider: 'google'
    };
  }

  async function fallbackSyncCustomerProfile(payload) {
    const fallbackCustomer = buildFallbackCustomer();

    try {
      const { data, error } = await supabase
        .from('customers')
        .upsert([{ 
          auth_user_id: state.user.id,
          full_name: payload.p_full_name,
          email: payload.p_email,
          phone: payload.p_phone,
          avatar_url: payload.p_avatar_url,
          auth_provider: payload.p_auth_provider
        }], { onConflict: 'auth_user_id' })
        .select('*')
        .single();

      if (!error && data) {
        state.portalStatus = 'ready';
        state.portalMessage = '';
        return data;
      }
    } catch (error) {}

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', state.user.id)
        .maybeSingle();

      if (!error && data) {
        state.portalStatus = 'ready';
        state.portalMessage = '';
        return data;
      }
    } catch (error) {}

    state.portalStatus = 'limited';
    state.portalMessage = 'Algumas informações da sua área ainda estão sendo sincronizadas.';
    return fallbackCustomer;
  }

  function mapAppointment(item) {
    return {
      ...item,
      service_id: item.service_id || item.serviceId || null,
      attendance_status: item.attendance_status || item.attendanceStatus || 'scheduled',
      can_review: item.can_review === true || item.canReview === true,
      reviewed_at: item.reviewed_at || item.reviewedAt || null,
      service_title: item.service_title || item.serviceTitle || '',
      service_category: item.service_category || item.serviceCategory || '',
      duration_minutes: item.duration_minutes || item.durationMinutes || null,
      booking_reference: item.booking_reference || item.bookingReference || 'Agendamento',
      start_at: item.start_at || item.startAt || null,
      end_at: item.end_at || item.endAt || null,
      status: item.status || 'pending'
    };
  }

  function loadCatalogFallbackFromWindow() {
    if (Array.isArray(window.__RS_SERVICE_CATALOG__) && window.__RS_SERVICE_CATALOG__.length) {
      return window.__RS_SERVICE_CATALOG__;
    }
    if (Array.isArray(window.__RS_FALLBACK_SERVICES__) && window.__RS_FALLBACK_SERVICES__.length) {
      return window.__RS_FALLBACK_SERVICES__;
    }
    return [];
  }

  function buildServicesCatalogMap(list) {
    return (list || []).reduce((acc, service) => {
      const key = String(service?.id ?? '').trim();
      if (!key) return acc;
      acc[key] = {
        id: service.id,
        title: service.title || '',
        category: service.category || '',
        duration_minutes: Number(service.duration_minutes || service.duration || 0) || 0
      };
      return acc;
    }, {});
  }

  async function loadServicesCatalog() {
    const fallbackCatalog = loadCatalogFallbackFromWindow();
    const fallbackMap = buildServicesCatalogMap(fallbackCatalog);

    const { data, error } = await supabase
      .from('services')
      .select('id, title, category, duration_minutes, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true });

    if (error || !Array.isArray(data) || data.length === 0) {
      return fallbackMap;
    }

    return buildServicesCatalogMap(data);
  }

  function isMeaningfulServiceTitle(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized && normalized !== 'serviço' && normalized !== 'servico';
  }

  function isMeaningfulServiceCategory(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized && normalized !== 'atendimento' && normalized !== 'serviço' && normalized !== 'servico';
  }

  function getServiceCatalogItem(serviceId) {
    const key = String(serviceId || '').trim();
    if (!key) return null;
    return state.servicesCatalog?.[key] || null;
  }

  function getAppointmentPresentation(item) {
    const serviceCatalog = getServiceCatalogItem(item.service_id);
    const serviceTitle = isMeaningfulServiceTitle(item.service_title)
      ? item.service_title
      : (isMeaningfulServiceTitle(serviceCatalog?.title) ? serviceCatalog.title : 'Procedimento agendado');
    const serviceCategory = isMeaningfulServiceCategory(item.service_category)
      ? item.service_category
      : (isMeaningfulServiceCategory(serviceCatalog?.category) ? serviceCatalog.category : 'Reserva confirmada no site');
    const durationMinutes = Number(item.duration_minutes || serviceCatalog?.duration_minutes || 0) || null;
    const durationLabel = durationMinutes ? `${durationMinutes} min` : 'Duração informada no atendimento';
    const bookingCode = String(item.booking_reference || '').trim();
    const bookingReferenceLabel = bookingCode ? `Ref. ${bookingCode}` : 'Reserva online';
    const reservationLabel = item.status === 'confirmed'
      ? 'Reserva confirmada'
      : item.status === 'pending'
        ? 'Reserva em análise'
        : item.status === 'cancelled'
          ? 'Reserva cancelada'
          : item.status === 'expired'
            ? 'Reserva expirada'
            : 'Reserva registrada';
    const attendanceLabel = ['completed', 'attended'].includes(item.attendance_status)
      ? 'Atendimento concluído'
      : item.attendance_status === 'cancelled'
        ? 'Atendimento cancelado'
        : item.attendance_status === 'no_show'
          ? 'Não compareceu'
          : 'Atendimento agendado';

    return {
      serviceTitle,
      serviceCategory,
      durationLabel,
      bookingReferenceLabel,
      reservationLabel,
      attendanceLabel
    };
  }

  function getAppointmentHelperCopy(item, canReview, isCompleted) {
    if (item.reviewed_at) {
      return 'Sua avaliação já foi enviada. Obrigada por compartilhar sua experiência.';
    }
    if (canReview) {
      return 'Seu atendimento foi concluído e a avaliação já está liberada para você.';
    }
    if (isCompleted) {
      return 'Seu atendimento foi concluído. Assim que a avaliação for liberada no painel, ela aparece aqui.';
    }
    if (item.status === 'pending') {
      return 'Seu pedido de agendamento foi recebido e está aguardando confirmação da agenda.';
    }
    if (item.status === 'confirmed') {
      return 'Seu horário está confirmado. A avaliação será liberada após o atendimento ser concluído.';
    }
    if (item.status === 'cancelled') {
      return 'Este agendamento foi cancelado. Se precisar, fale conosco para remarcar.';
    }
    return 'Acompanhe aqui o andamento do seu horário e a liberação da avaliação.';
  }

  function getAppointmentsEmptyHtml() {
    if (state.portalStatus === 'limited') {
      return `
        <div>
          <p class="text-sm font-semibold text-stone-700 mb-2">Sua área já está conectada</p>
          <p class="text-stone-500 leading-relaxed">Estamos concluindo a sincronização do histórico. Enquanto isso, você já pode usar o mesmo WhatsApp do agendamento para localizar suas reservas.</p>
        </div>`;
    }

    return `
      <div>
        <p class="text-sm font-semibold text-stone-700 mb-2">Nenhum agendamento encontrado</p>
        <p class="text-stone-500 leading-relaxed">Se você já reservou antes de entrar com Google, use o mesmo WhatsApp do agendamento para trazer suas reservas para esta conta.</p>
      </div>`;
  }

  function getReviewsEmptyHtml() {
    return `
      <article class="customer-shell-empty-card">
        <p class="text-sm font-semibold text-stone-700 mb-2">Avaliações verificadas</p>
        <p class="text-stone-500 leading-relaxed">Suas avaliações aparecem aqui assim que houver um atendimento concluído e vinculado à sua conta.</p>
      </article>`;
  }

  function setActiveView(view) {
    state.activeView = view || 'appointments';

    dom.shellTabs.forEach((button) => {
      const isActive = button.dataset.customerView === state.activeView;
      button.classList.toggle('is-active', isActive);
    });

    dom.shellPanels.forEach((panel) => {
      const isActive = panel.dataset.customerPanel === state.activeView;
      panel.classList.toggle('hidden', !isActive);
    });
  }

  function toggleDropdown(force) {
    if (!dom.navDropdown) return;
    const shouldOpen = typeof force === 'boolean' ? force : dom.navDropdown.classList.contains('hidden');
    dom.navDropdown.classList.toggle('hidden', !shouldOpen);
  }

  function closeDropdown() {
    toggleDropdown(false);
  }

  function setOverlayLockState() {
    const isShellOpen = dom.shell && !dom.shell.classList.contains('hidden');
    const isReviewOpen = dom.reviewModal && !dom.reviewModal.classList.contains('hidden');
    const shouldLock = Boolean(isShellOpen || isReviewOpen);

    document.body.classList.toggle('customer-overlay-open', shouldLock);
    document.documentElement.classList.toggle('customer-overlay-open', shouldLock);
    document.body.style.overflow = shouldLock ? 'hidden' : '';
    document.documentElement.style.overflow = shouldLock ? 'hidden' : '';
  }

  function openShell(view) {
    if (!state.user) {
      loginWithGoogle();
      return;
    }

    setActiveView(view || state.activeView || 'appointments');
    dom.shell?.classList.remove('hidden');
    dom.shellBackdrop?.classList.remove('hidden');
    setOverlayLockState();
    closeDropdown();
  }

  function closeShell() {
    dom.shell?.classList.add('hidden');
    dom.shellBackdrop?.classList.add('hidden');
    setOverlayLockState();
  }

  async function loginWithGoogle() {
    const redirectTo = getSafeRedirectTo();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });

    if (error) {
      window.alert(error.message || 'Não foi possível entrar com Google.');
    }
  }

  async function logout() {
    closeDropdown();
    closeShell();
    cleanupAuthHash();

    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      window.alert(error.message || 'Não foi possível sair.');
      return;
    }

    state.user = null;
    state.customer = null;
    state.appointments = [];
    state.reviewCount = 0;
    state.publicReviews = [];
    state.portalStatus = 'idle';
    state.portalMessage = '';
    closeDropdown();
    closeShell();
    renderAll();
  }

  async function getCurrentUser() {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data?.session?.user || null;
  }

  async function syncCustomerProfile() {
    if (!state.user) return null;

    const meta = getSessionUserMeta(state.user);
    const payload = {
      p_full_name: meta.full_name || meta.name || state.user.user_metadata?.full_name || '',
      p_email: state.user.email || meta.email || '',
      p_phone: null,
      p_avatar_url: meta.avatar_url || state.user.user_metadata?.avatar_url || '',
      p_auth_provider: 'google'
    };

    const { data, error } = await supabase.rpc('upsert_my_customer_profile', payload);

    if (error) {
      if (isSchemaActivationError(error)) {
        return fallbackSyncCustomerProfile(payload);
      }

      state.portalStatus = 'limited';
      state.portalMessage = 'Não foi possível sincronizar todos os dados da sua área agora.';
      return buildFallbackCustomer();
    }

    state.portalStatus = 'ready';
    state.portalMessage = '';
    return data || buildFallbackCustomer();
  }


  async function loadAppointments() {
    let data = null;
    let error = null;

    ({ data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('customer_user_id', state.user.id)
      .order('start_at', { ascending: false }));

    if (error && isMissingDbObjectError(error)) {
      ({ data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('start_at', { ascending: false }));
    }

    if (error) {
      console.error('[customer-review] appointments load failed', error);
      state.portalStatus = state.portalStatus === 'limited' ? 'limited' : 'unavailable';
      state.portalMessage = 'Não foi possível carregar seus agendamentos agora.';
      return [];
    }

    if (state.portalStatus !== 'limited') {
      state.portalStatus = 'ready';
      state.portalMessage = '';
    }

    const list = sortAppointmentsDescending((data || []).map(mapAppointment));
    return list.filter((item) => !item.customer_user_id || item.customer_user_id === state.user.id);
  }

  async function loadReviewCount() {
    const serviceReviews = await supabase
      .from('service_reviews')
      .select('id', { count: 'exact', head: true });

    if (!serviceReviews.error) return serviceReviews.count || 0;

    const legacyReviews = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true });

    if (!legacyReviews.error) return legacyReviews.count || 0;

    return 0;
  }

  async function loadPublicReviews() {
    let data = null;
    let error = null;

    ({ data, error } = await supabase
      .from('public_service_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8));

    if (error) {
      console.warn('[customer-review] public_service_reviews unavailable, trying service_reviews', error);
      ({ data, error } = await supabase
        .from('service_reviews')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(8));
    }

    if (error) {
      console.warn('[customer-review] service_reviews unavailable, trying legacy reviews', error);
      ({ data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(8));
    }

    state.publicReviews = error ? [] : (data || []).map((item) => ({
      customer_name: item.customer_name || item.public_name || 'Cliente',
      service_title: item.service_title || item.service || 'Atendimento',
      rating: item.rating || 0,
      comment: item.comment || '',
      admin_reply: item.admin_reply || item.reply || '',
      created_at: item.created_at || item.inserted_at || null
    }));
  }

  function renderNav() {

    const isLogged = Boolean(state.user);

    if (!dom.navTrigger || !dom.navLabel || !dom.navAvatar) return;

    if (!isLogged) {
      dom.navTrigger.classList.remove('is-authenticated');
      dom.navLabel.textContent = 'Minha área';
      dom.navAvatar.classList.add('hidden');
      dom.menuLogout?.classList.add('hidden');
      dom.navUserPreview?.classList.add('hidden');
      closeDropdown();
      return;
    }

    const avatar = getAvatarUrl();
    const fullName = getDisplayName();

    dom.navTrigger.classList.add('is-authenticated');
    dom.navLabel.textContent = fullName;
    dom.navAvatar.src = avatar;
    dom.navAvatar.classList.remove('hidden');
    dom.menuLogout?.classList.remove('hidden');

    if (dom.navUserPreview) dom.navUserPreview.classList.remove('hidden');
    if (dom.navPreviewAvatar) dom.navPreviewAvatar.src = avatar;
    if (dom.navPreviewName) dom.navPreviewName.textContent = fullName;
    if (dom.navPreviewEmail) dom.navPreviewEmail.textContent = state.user?.email || '';
  }

  function renderShellHeader() {
    if (!state.user) return;

    const avatar = getAvatarUrl();
    const fullName = getDisplayName();
    const completedCount = state.appointments.filter((item) => ['completed', 'attended'].includes(item.attendance_status)).length;
    const pendingReviews = state.appointments.filter((item) => item.can_review === true && !item.reviewed_at);

    if (dom.avatar) dom.avatar.src = avatar;
    if (dom.name) dom.name.textContent = fullName;
    if (dom.email) dom.email.textContent = state.user.email || '-';
    if (dom.statAppointments) dom.statAppointments.textContent = String(state.appointments.length);
    if (dom.statCompleted) dom.statCompleted.textContent = String(completedCount);
    if (dom.statReviews) dom.statReviews.textContent = String(state.reviewCount);

    if (dom.shellPendingBanner && dom.shellPendingCopy) {
      if (pendingReviews.length > 0) {
        dom.shellPendingBanner.classList.remove('hidden');
        dom.shellPendingBanner.querySelector('.customer-shell-pending-badge').textContent = String(pendingReviews.length);
        dom.shellPendingCopy.textContent = pendingReviews.length === 1
          ? '1 serviço aguarda avaliação'
          : `${pendingReviews.length} serviços aguardam avaliação`;
      } else {
        dom.shellPendingBanner.classList.add('hidden');
      }
    }
  }

  function renderPublicReviews() {
    if (!dom.publicReviews) return;

    const pendingAppointments = state.appointments.filter((item) => item.can_review === true && !item.reviewed_at);
    const pendingLead = pendingAppointments[0] ? getAppointmentPresentation(pendingAppointments[0]) : null;
    const totalReviews = state.publicReviews.length;
    const averageRating = totalReviews
      ? (state.publicReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / totalReviews).toFixed(1).replace('.', ',')
      : '0,0';

    const pendingBlock = pendingAppointments.length
      ? `
        <article class="customer-review-highlight customer-review-highlight--googlelike">
          <div class="customer-review-highlight-inner">
            <div class="customer-review-showcase-top">
              <div>
                <p class="customer-panel-eyebrow">Sua próxima contribuição</p>
                <h4 class="customer-review-showcase-title">Compartilhe como foi ${escapeHtml((pendingLead?.serviceTitle || 'seu atendimento').toLowerCase())}</h4>
                <p class="customer-appointment-helper mt-3">Seu depoimento pode aparecer na área de avaliações verificadas assim que for aprovado pela equipe.</p>
              </div>
              <div class="customer-review-pending-pill">${pendingAppointments.length} aguardando</div>
            </div>
            <div class="customer-review-highlight-bar">
              <div>
                <span class="customer-review-highlight-label">Atendimento concluído</span>
                <strong>${escapeHtml(formatDateTime(pendingAppointments[0].start_at))}</strong>
              </div>
              <button type="button" data-open-customer-review="true" data-appointment-id="${escapeHtml(pendingAppointments[0].id)}" data-service-title="${escapeHtml(pendingLead?.serviceTitle || 'Serviço')}" class="customer-inline-action">Avaliar agora</button>
            </div>
          </div>
        </article>`
      : '';

    const reviewsBlock = totalReviews
      ? `
        <section class="customer-reviews-showcase">
          <div class="customer-reviews-showcase-head">
            <div>
              <p class="customer-panel-eyebrow">Avaliações verificadas</p>
              <h4 class="customer-reviews-showcase-title">O que as clientes dizem sobre a experiência</h4>
              <p class="customer-panel-copy max-w-2xl mt-3">Mostramos depoimentos reais aprovados pela equipe. Cada nova avaliação enviada pela área da cliente pode aparecer aqui após a revisão.</p>
            </div>
            <div class="customer-reviews-showcase-stats">
              <article class="customer-reviews-stat-card">
                <strong>${averageRating} <span>★</span></strong>
                <span>média publicada</span>
              </article>
              <article class="customer-reviews-stat-card">
                <strong>${totalReviews}</strong>
                <span>avaliações aprovadas</span>
              </article>
            </div>
          </div>
          <div class="customer-reviews-grid">
            ${state.publicReviews.map((review) => {
              const stars = Number(review.rating || 0);
              const initials = String(review.customer_name || 'Cliente').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CL';
              return `
                <article class="customer-review-card customer-review-card--public">
                  <div class="customer-review-card-top">
                    <div class="customer-review-avatar">${escapeHtml(initials)}</div>
                    <div class="customer-review-card-headline min-w-0">
                      <p class="truncate text-sm font-semibold text-stone-800">${escapeHtml(review.customer_name || 'Cliente')}</p>
                      <p class="truncate text-xs text-stone-400">Avaliação verificada • ${escapeHtml(review.service_title || 'Atendimento')}</p>
                    </div>
                    <span class="customer-review-quote">”</span>
                  </div>
                  <div class="customer-review-stars-row">${'★'.repeat(stars)}${'☆'.repeat(Math.max(0, 5 - stars))}<span>${escapeHtml(formatRelativeDate(review.created_at))}</span></div>
                  <p class="customer-review-public-copy">${escapeHtml(review.comment || 'Atendimento avaliado positivamente pela cliente.')}</p>
                  ${review.admin_reply ? `<div class="customer-review-reply"><strong>Resposta da equipe</strong><p>${escapeHtml(review.admin_reply)}</p></div>` : ''}
                </article>`;
            }).join('')}
          </div>
        </section>`
      : getReviewsEmptyHtml();

    dom.publicReviews.innerHTML = `${pendingBlock}${reviewsBlock}`;
    bindReviewButtons();
  }

  function bindReviewButtons() {
    document.querySelectorAll('[data-open-customer-review="true"]').forEach((button) => {
      button.addEventListener('click', () => {
        openReviewModal(button.getAttribute('data-appointment-id'), button.getAttribute('data-service-title'));
      });
    });
  }

  function renderAppointments() {
    if (!dom.appointmentsEmpty || !dom.appointmentsList || !dom.linkForm) return;

    if (!state.user) {
      dom.appointmentsEmpty.classList.remove('hidden');
      dom.appointmentsEmpty.innerHTML = `
        <div>
          <p class="text-sm font-semibold text-stone-700 mb-2">Sua área pessoal</p>
          <p class="text-stone-500 leading-relaxed">Entre com Google para acompanhar seus agendamentos, ver o andamento do atendimento e enviar suas avaliações com segurança.</p>
        </div>`;
      dom.appointmentsList.classList.add('hidden');
      dom.appointmentsList.innerHTML = '';
      dom.linkForm.classList.add('hidden');
      return;
    }

    renderShellHeader();

    if (!state.appointments.length) {
      dom.appointmentsEmpty.classList.remove('hidden');
      dom.appointmentsEmpty.innerHTML = getAppointmentsEmptyHtml();
      dom.appointmentsList.classList.add('hidden');
      dom.appointmentsList.innerHTML = '';
      dom.linkForm.classList.remove('hidden');
      return;
    }

    dom.appointmentsEmpty.classList.add('hidden');
    dom.appointmentsList.classList.remove('hidden');
    dom.linkForm.classList.remove('hidden');

    dom.appointmentsList.innerHTML = state.appointments.map((item) => {
      const isCompleted = ['completed', 'attended'].includes(item.attendance_status);
      const canReview = item.can_review === true && !item.reviewed_at && (isCompleted || ['completed','attended'].includes(item.attendance_status) || item.status === 'confirmed');
      const dayLabel = item.start_at ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(item.start_at)).replace('.', '').toUpperCase() : '--';
      const timeLabel = item.start_at ? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.start_at)) : '--:--';
      const attendanceClass = isCompleted ? 'customer-chip--completed' : (item.status === 'pending' ? 'customer-chip--pending' : 'customer-chip--scheduled');
      const presentation = getAppointmentPresentation(item);
      const helperCopy = getAppointmentHelperCopy(item, canReview, isCompleted);
      const reviewActionLabel = canReview ? 'Avaliar agora' : item.reviewed_at ? 'Avaliação enviada' : 'Aguardando liberação';

      return `
        <article class="customer-appointment-card">
          <div class="customer-appointment-top">
            <div class="min-w-0">
              <p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">${escapeHtml(presentation.bookingReferenceLabel)}</p>
              <h4 class="customer-appointment-service">${escapeHtml(presentation.serviceTitle)}</h4>
              <p class="customer-appointment-category">${escapeHtml(presentation.serviceCategory)}</p>
              <div class="customer-chip-row">
                <span class="customer-chip ${attendanceClass}">${escapeHtml(presentation.attendanceLabel)}</span>
                <span class="customer-chip">${escapeHtml(presentation.reservationLabel)}</span>
                ${canReview ? '<span class="customer-chip customer-chip--review">Avaliação liberada</span>' : ''}
              </div>
            </div>
            <div class="customer-appointment-date">
              <span class="customer-date-day">${escapeHtml(dayLabel)}</span>
              <span class="customer-date-time">${escapeHtml(timeLabel)}</span>
            </div>
          </div>

          <div class="customer-appointment-meta-grid">
            <div class="customer-appointment-meta"><span>Quando</span><strong>${escapeHtml(formatDateTime(item.start_at))}</strong></div>
            <div class="customer-appointment-meta"><span>Duração estimada</span><strong>${escapeHtml(presentation.durationLabel)}</strong></div>
          </div>

          <div class="customer-appointment-footer">
            <p class="customer-appointment-helper">${escapeHtml(helperCopy)}</p>
            ${canReview
              ? `<button type="button" data-open-customer-review="true" data-appointment-id="${escapeHtml(item.id)}" data-service-title="${escapeHtml(presentation.serviceTitle)}" class="customer-inline-action">Avaliar agora</button>`
              : item.reviewed_at
                ? '<span class="customer-inline-note">Avaliação enviada</span>'
                : `<span class="customer-inline-note">${escapeHtml(reviewActionLabel)}</span>`}
          </div>
        </article>`;
    }).join('');

    bindReviewButtons();
  }

  function setStarRating(value) {
    if (dom.reviewRating) dom.reviewRating.value = String(value);
    document.querySelectorAll('.customer-review-star').forEach((star) => {
      const rating = Number(star.dataset.rating || 0);
      star.classList.toggle('text-amber-500', rating <= value);
      star.classList.toggle('text-stone-300', rating > value);
      star.classList.toggle('is-active', rating <= value);
    });
    updateReviewComposer();
  }

  function openReviewModal(appointmentId, serviceTitle) {
    if (!dom.reviewModal) return;
    if (dom.reviewAppointmentId) dom.reviewAppointmentId.value = appointmentId || '';
    if (dom.reviewService) dom.reviewService.textContent = serviceTitle || 'Serviço';
    dom.reviewForm?.classList.remove('hidden');
    document.getElementById('customer-review-success')?.classList.add('hidden');
    resetReviewComposer();
    dom.reviewModal.classList.remove('hidden');
    setOverlayLockState();
  }

  function closeReviewModal() {
    dom.reviewModal?.classList.add('hidden');
    dom.reviewForm?.classList.remove('hidden');
    document.getElementById('customer-review-success')?.classList.add('hidden');
    setOverlayLockState();
  }

  async function refreshCustomerData() {
    state.user = await getCurrentUser();

    if (!state.user) {
      state.customer = null;
      state.appointments = [];
      state.reviewCount = 0;
      state.publicReviews = [];
      state.servicesCatalog = buildServicesCatalogMap(loadCatalogFallbackFromWindow());
      state.portalStatus = 'idle';
      state.portalMessage = '';
      renderAll();
      return;
    }

    state.customer = await syncCustomerProfile();

    const [appointments, reviewCount, servicesCatalog] = await Promise.all([
      loadAppointments(),
      loadReviewCount(),
      loadServicesCatalog()
    ]);

    state.servicesCatalog = servicesCatalog;
    state.appointments = appointments;
    state.reviewCount = reviewCount;
    await loadPublicReviews();
    renderAll();
  }

  async function linkAppointmentsByPhone(event) {
    event.preventDefault();
    if (!dom.linkPhone || !dom.linkFeedback) return;

    const phone = normalizePhone(dom.linkPhone.value);
    if (phone.length < 10) {
      dom.linkFeedback.textContent = 'Digite o mesmo WhatsApp usado no agendamento.';
      dom.linkFeedback.className = 'mt-3 text-sm text-rose-600';
      return;
    }

    dom.linkFeedback.textContent = 'Vinculando seus agendamentos...';
    dom.linkFeedback.className = 'mt-3 text-sm text-stone-500';

    const { data, error } = await supabase.rpc('link_my_appointments_by_phone', { p_phone: phone });
    if (error) {
      dom.linkFeedback.textContent = isSchemaActivationError(error)
        ? 'Ainda não foi possível localizar reservas automaticamente com esse WhatsApp.'
        : (error.message || 'Não foi possível vincular seus agendamentos agora.');
      dom.linkFeedback.className = 'mt-3 text-sm text-rose-600';
      return;
    }

    const qty = Number(data || 0);
    dom.linkFeedback.textContent = qty > 0
      ? `${qty} agendamento(s) vinculado(s) com sucesso.`
      : 'Não encontramos agendamentos com esse WhatsApp ainda.';
    dom.linkFeedback.className = qty > 0 ? 'mt-3 text-sm text-emerald-700' : 'mt-3 text-sm text-stone-500';

    await refreshCustomerData();
    if (qty > 0) openShell('appointments');
  }


  async function fetchAppointmentById(appointmentId) {
    const localMatch = state.appointments.find((item) => String(item.id) === String(appointmentId));
    if (localMatch) return localMatch;

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .maybeSingle();

    if (error || !data) return null;
    return mapAppointment(data);
  }

  async function tryRecoverAppointmentOwnershipForReview(appointmentId) {
    const appointment = await fetchAppointmentById(appointmentId);
    const candidatePhones = [
      appointment?.customer_phone,
      state.customer?.phone
    ].map(normalizePhone).filter((value) => value && value.length >= 10);

    await syncCustomerProfile();

    for (const phone of candidatePhones) {
      const response = await supabase.rpc('link_my_appointments_by_phone', { p_phone: phone });
      if (!response.error) {
        await refreshCustomerData();
        const refreshed = state.appointments.find((item) => String(item.id) === String(appointmentId));
        if (refreshed) return true;
      }
    }

    return false;
  }

  function generateClientUuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = Math.random() * 16 | 0;
      const value = char === 'x' ? random : ((random & 0x3) | 0x8);
      return value.toString(16);
    });
  }

  async function tryCreateReviewViaRpc(appointmentId, rating, payloadComment) {
    return supabase.rpc('create_my_service_review', {
      p_appointment_id: appointmentId,
      p_rating: rating,
      p_comment: payloadComment
    });
  }

  async function shouldFallbackToDirectReviewInsert(appointmentId, error) {
    const normalized = [error?.message, error?.details, error?.hint].filter(Boolean).join(' ').toLowerCase();
    if (!normalized) return false;

    if (
      isRecoverableRpcError(error) ||
      normalized.includes('não pode avaliar') ||
      normalized.includes('nao pode avaliar') ||
      normalized.includes('cliente não encontrado') ||
      normalized.includes('cliente nao encontrado')
    ) {
      return true;
    }

    if (!normalized.includes('ainda não liberada') && !normalized.includes('ainda nao liberada')) {
      return false;
    }

    const appointment = await fetchAppointmentById(appointmentId);
    const customer = state.customer || await syncCustomerProfile();
    const normalizedAppointmentPhone = normalizePhone(appointment?.customer_phone || '');
    const normalizedCustomerPhone = normalizePhone(customer?.phone || '');
    const ownsAppointment = Boolean(
      appointment && state.user && (
        appointment.customer_user_id === state.user.id ||
        (!!appointment.customer_id && !!customer?.id && appointment.customer_id === customer.id) ||
        (!!normalizedAppointmentPhone && !!normalizedCustomerPhone && normalizedAppointmentPhone === normalizedCustomerPhone)
      )
    );
    const completed = ['completed', 'attended'].includes(appointment?.attendance_status || '');
    const locallyUnlocked = state.appointments.some((item) => String(item.id) === String(appointmentId) && item.can_review === true && !item.reviewed_at);
    const notReviewed = !appointment?.reviewed_at;

    return Boolean(ownsAppointment && completed && notReviewed && (locallyUnlocked || appointment?.can_review === true));
  }

  async function tryInsertReviewDirectly(appointmentId, rating, payloadComment) {
    const appointment = await fetchAppointmentById(appointmentId);
    if (!appointment) {
      return { data: null, error: { message: 'Agendamento não encontrado.' } };
    }

    const currentCustomer = state.customer || await syncCustomerProfile();
    if (!currentCustomer?.id || !state.user?.id) {
      return { data: null, error: { message: 'Cliente não encontrado para esta conta.' } };
    }

    const normalizedAppointmentPhone = normalizePhone(appointment.customer_phone);
    const normalizedCustomerPhone = normalizePhone(currentCustomer.phone || '');
    const canClaimOwnership = (
      appointment.customer_user_id === state.user.id ||
      (!!appointment.customer_id && appointment.customer_id === currentCustomer.id) ||
      (!!normalizedAppointmentPhone && !!normalizedCustomerPhone && normalizedAppointmentPhone === normalizedCustomerPhone)
    );

    if (canClaimOwnership && appointment.customer_user_id !== state.user.id) {
      const { error: claimError } = await supabase
        .from('appointments')
        .update({ customer_user_id: state.user.id, customer_id: currentCustomer.id })
        .eq('id', appointmentId);
      if (claimError) {
        console.warn('[customer-review] unable to claim appointment ownership before direct insert', claimError);
      }
    }

    const serviceReviewVariants = [
      {
        id: generateClientUuid(),
        appointment_id: appointmentId,
        customer_id: currentCustomer.id,
        customer_user_id: state.user.id,
        service_id: appointment.service_id || null,
        rating,
        title: (payloadComment || '').split('—')[0]?.trim()?.slice(0, 120) || 'Experiência compartilhada',
        comment: payloadComment,
        public_name: getDisplayName(),
        status: 'pending'
      },
      {
        id: generateClientUuid(),
        appointment_id: appointmentId,
        customer_id: currentCustomer.id,
        service_id: appointment.service_id || null,
        rating,
        title: (payloadComment || '').split('—')[0]?.trim()?.slice(0, 120) || 'Experiência compartilhada',
        comment: payloadComment,
        public_name: getDisplayName(),
        status: 'pending'
      }
    ];

    let attempt = { data: null, error: null };
    for (const variant of serviceReviewVariants) {
      attempt = await supabase
        .from('service_reviews')
        .insert([variant])
        .select('*')
        .maybeSingle();
      if (!attempt.error) {
        return attempt;
      }
    }

    console.warn('[customer-review] direct insert into service_reviews failed, trying legacy reviews', attempt.error);

    const legacyVariants = [
      {
        id: generateClientUuid(),
        appointment_id: appointmentId,
        customer_id: currentCustomer.id,
        service_id: appointment.service_id || null,
        rating,
        title: (payloadComment || '').split('—')[0]?.trim()?.slice(0, 120) || 'Experiência compartilhada',
        comment: payloadComment,
        status: 'pending',
        public_name: getDisplayName()
      },
      {
        id: generateClientUuid(),
        appointment_id: appointmentId,
        customer_id: currentCustomer.id,
        service_id: appointment.service_id || null,
        rating,
        title: (payloadComment || '').split('—')[0]?.trim()?.slice(0, 120) || 'Experiência compartilhada',
        comment: payloadComment,
        status: 'pending'
      }
    ];

    for (const variant of legacyVariants) {
      attempt = await supabase
        .from('reviews')
        .insert([variant])
        .select('*')
        .maybeSingle();
      if (!attempt.error) {
        return attempt;
      }
    }

    return attempt;
  }

  async function markAppointmentAsReviewedBestEffort(appointmentId) {
    let rpc = await supabase.rpc('finalize_my_review_submission', { p_appointment_id: appointmentId });
    if (!rpc.error) return;

    const patch = {
      reviewed_at: new Date().toISOString(),
      can_review: false
    };

    const { error } = await supabase
      .from('appointments')
      .update(patch)
      .eq('id', appointmentId);

    if (error) {
      console.warn('[customer-review] unable to mark appointment as reviewed', error, rpc.error);
    }
  }


  async function submitReview(event) {
    event.preventDefault();
    const appointmentId = dom.reviewAppointmentId?.value;
    const rating = Number(dom.reviewRating?.value || 0);
    const title = dom.reviewTitle?.value?.trim() || '';
    const comment = dom.reviewComment?.value?.trim() || '';
    const tags = getSelectedReviewTags();
    const recommendation = getReviewRecommendation();
    const payloadComment = buildReviewCommentPayload(rating, [title, comment].filter(Boolean).join(' — '), tags, recommendation);

    setReviewFeedback('');
    document.getElementById('customer-review-success')?.classList.add('hidden');

    if (!appointmentId) {
      setReviewFeedback('Agendamento inválido.');
      return;
    }
    if (rating < 1 || rating > 5) {
      setReviewFeedback('Escolha uma nota de 1 a 5 antes de enviar.');
      return;
    }

    if (dom.reviewSubmit) {
      dom.reviewSubmit.disabled = true;
      dom.reviewSubmit.textContent = 'Enviando...';
    }

    let result = await tryCreateReviewViaRpc(appointmentId, rating, payloadComment);
    const normalizedError = [result.error?.message, result.error?.details, result.error?.hint].filter(Boolean).join(' ').toLowerCase();

    if (result.error && (normalizedError.includes('não pode avaliar') || normalizedError.includes('nao pode avaliar') || normalizedError.includes('cliente não encontrado') || normalizedError.includes('cliente nao encontrado'))) {
      const recovered = await tryRecoverAppointmentOwnershipForReview(appointmentId);
      if (recovered) {
        result = await tryCreateReviewViaRpc(appointmentId, rating, payloadComment);
      }
    }

    if (result.error && await shouldFallbackToDirectReviewInsert(appointmentId, result.error)) {
      console.warn('[customer-review] review RPC blocked, trying direct insert fallback', result.error);
      result = await tryInsertReviewDirectly(appointmentId, rating, payloadComment);
      if (!result.error) {
        await markAppointmentAsReviewedBestEffort(appointmentId);
      }
    }

    if (dom.reviewSubmit) {
      dom.reviewSubmit.disabled = false;
      dom.reviewSubmit.textContent = 'Enviar avaliação';
    }

    if (result.error) {
      console.error('[customer-review] review submit failed', result.error);
      setReviewFeedback(formatReviewError(result.error));
      return;
    }

    if (dom.reviewSuccessRating) {
      dom.reviewSuccessRating.textContent = `${'★'.repeat(rating)}${'☆'.repeat(Math.max(0, 5 - rating))}`;
    }
    if (dom.reviewSuccessService) {
      dom.reviewSuccessService.textContent = dom.reviewService?.textContent || 'Serviço';
    }
    if (dom.reviewSuccessTitle) {
      dom.reviewSuccessTitle.textContent = buildReviewHeadline(rating, title);
    }

    dom.reviewForm?.classList.add('hidden');
    document.getElementById('customer-review-success')?.classList.remove('hidden');
    await refreshCustomerData();
    renderPublicReviews();
  }

  function renderAll() {

    renderNav();
    renderShellHeader();
    renderAppointments();
    renderPublicReviews();
  }

  function bindEvents() {
    dom.navTrigger?.addEventListener('click', () => {
      if (!state.user) {
        loginWithGoogle();
        return;
      }
      toggleDropdown();
    });

    dom.menuAppointments?.addEventListener('click', () => openShell('appointments'));
    dom.shellPendingBanner?.addEventListener('click', () => openShell('reviews'));
    dom.menuReviews?.addEventListener('click', () => openShell('reviews'));
    dom.menuLogout?.addEventListener('click', logout);
    dom.shellClose?.addEventListener('click', closeShell);
    dom.shellBackdrop?.addEventListener('click', closeShell);

    dom.shellTabs.forEach((button) => {
      button.addEventListener('click', () => setActiveView(button.dataset.customerView || 'appointments'));
    });

    dom.linkPhone?.addEventListener('input', (event) => {
      event.target.value = formatPhone(event.target.value);
    });
    dom.linkForm?.addEventListener('submit', linkAppointmentsByPhone);
    dom.reviewClose?.addEventListener('click', closeReviewModal);
    dom.reviewCancel?.addEventListener('click', closeReviewModal);
    dom.reviewSuccessClose?.addEventListener('click', () => {
      closeReviewModal();
      openShell('reviews');
    });
    dom.reviewForm?.addEventListener('submit', submitReview);
    dom.reviewComment?.addEventListener('input', updateReviewComposer);
    dom.reviewTitle?.addEventListener('input', updateReviewComposer);
    dom.reviewModal?.addEventListener('click', (event) => {
      if (event.target === dom.reviewModal) closeReviewModal();
    });
    document.querySelectorAll('.customer-review-star').forEach((star) => {
      star.addEventListener('click', () => setStarRating(Number(star.dataset.rating || 0)));
    });
    document.querySelectorAll('[data-review-tag]').forEach((button) => {
      button.addEventListener('click', () => toggleReviewTag(button));
    });
    document.querySelectorAll('[data-review-recommend]').forEach((button) => {
      button.addEventListener('click', () => setReviewRecommendation(button.dataset.reviewRecommend));
    });

    document.addEventListener('click', (event) => {
      if (dom.navShell && !dom.navShell.contains(event.target)) closeDropdown();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeDropdown();
        closeReviewModal();
        closeShell();
      }
    });
  }

  async function initialize() {
    cacheDom();
    setActiveView('appointments');
    bindEvents();
    updateReviewComposer();
    renderAll();
    await refreshCustomerData();
    cleanupAuthHash();
    supabase.auth.onAuthStateChange(async (_event) => {
      await refreshCustomerData();
      cleanupAuthHash();
    });
  }

  document.addEventListener('DOMContentLoaded', initialize);
})();
