const App = (() => {
            const runtimeConfig = window.APP_CONFIG || {};
            const CONFIG = {
                whatsappNumber: runtimeConfig.whatsappNumber || '5548996207529',
                businessName: runtimeConfig.businessName || 'RôSouza Beleza e Estética',
                address: runtimeConfig.address || 'Rua Álvaro Cardoso 116 - 88070-250',
                businessTimezone: runtimeConfig.businessTimezone || 'America/Sao_Paulo',
                pendingHoldMinutes: runtimeConfig.pendingHoldMinutes || 15,
                supabaseUrl: runtimeConfig.supabaseUrl || '',
                supabaseAnonKey: runtimeConfig.supabaseAnonKey || ''
            };

            const STORAGE_KEYS = {
                name: 'rosouza_name',
                phone: 'rosouza_phone'
            };

            const STEP_IDS = {
                home: 'step-0',
                serviceDetails: 'step-service-details',
                dateTime: 'step-1',
                form: 'step-2',
                success: 'step-3'
            };

            const STEP_ALIASES = {
                0: STEP_IDS.home,
                1: STEP_IDS.dateTime,
                2: STEP_IDS.form,
                3: STEP_IDS.success,
                'service-details': STEP_IDS.serviceDetails
            };

            const STEP_ACTIVE_DELAY_MS = 50;
            const REVEAL_REINIT_DELAY_MS = 100;
            const DATE_RANGE_DAYS = 20;
            const CLOSED_WEEKDAYS = new Set([0, 1]);
            const MIN_PHONE_LENGTH = 14;
            const DEFAULT_BEFORE_AFTER_WIDTH = 500;
            const EMPTY_NOTES_LABEL = 'Nenhuma';
            const AVAILABLE_TODAY_MESSAGE = 'Selecione uma data acima para visualizar as disponibilidades.';
            const FULL_DAY_MESSAGE = 'Uau, nosso dia hoje já está completo! Por favor, escolha outra data acima. 🥰';
            const CONTINUE_BUTTON_ENABLED_CLASS = 'w-full md:w-auto px-10 py-4 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 bg-stone-900 hover:bg-rose-600 hover:-translate-y-1 hover:shadow-xl';
            const CONTINUE_BUTTON_DISABLED_CLASS = 'w-full md:w-auto px-10 py-4 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 bg-stone-200 text-stone-400 cursor-not-allowed';
            const PLACEHOLDER_MEDIA_IMAGE = 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80';

            const instagramPosts = [
                { img: 'https://i.imgur.com/L6elGzm.jpeg', link: 'https://www.instagram.com/p/DSLI35BD45m/' },
                { img: 'https://i.imgur.com/Uw1Yres.png', link: 'https://www.instagram.com/p/DI9Wd4kvoi_/?img_index=1' },
                { img: 'https://i.imgur.com/7ttEXAN.jpeg', link: 'https://www.instagram.com/p/DNJ1-LdN9CZ/?img_index=1' },
                { img: 'https://i.imgur.com/0uH8pj9.png', link: 'https://www.instagram.com/p/DGV0OZ1OAz8/' }
            ];

        const fallbackGoogleReviews = [
            {
                name: "Samara Rodrigues",
                meta: "3 avaliações · 2 fotos",
                time: "2 anos atrás",
                rating: 5,
                text: "Uma excelente profissional, Essa sim entrega o resultado tão desejado. Super indico!! 😉 Amando minha sobrancelhas 😍",
                ownerReply: "Maravihosaa!! Gratidão ♡"
            },
            {
                name: "Camila Castro",
                meta: "12 avaliações",
                time: "2 anos atrás",
                rating: 5,
                text: "Excepcional! A Rosângela é uma profissional muito preparada, diferenciada e empática adaptando várias técnicas buscando promover o melhor resultado para sua cliente e ... Mais"
            },
            {
                name: "Laura Franz",
                meta: "5 avaliações",
                time: "um ano atrás",
                rating: 5,
                text: "Simpática, atenciosa e caprichosa. Trabalho perfeito, amei, super indico! 🥰 ..."
            },
            {
                name: "Jenifer Brito",
                meta: "1 avaliação",
                time: "2 anos atrás",
                rating: 5,
                text: "Amei muito o trabalho, extremamente profissional. Já tinha feito o procedimento em outra mas não pegou o pigmento na minha pele e agora ficou maravilhosa, do jeito que eu queria"
            },
            {
                name: "Jhessica Lyra",
                meta: "Local Guide · 57 avaliações · 108 fotos",
                time: "2 anos atrás",
                rating: 5,
                text: "Adorei, atendimento da Rosângela! Ela é muito querida, o lugar é bem confortável e muito agradável, ela me atendeu num horário que pra mim foi ótimo. Recomendo! ❤️"
            },
            {
                name: "Tatiane Nascimento",
                meta: "2 avaliações",
                time: "2 anos atrás",
                rating: 5,
                text: "Excelente profissional, atende com todo carinho e um ambiente aconchegante🥰 super indico ...",
                ownerReply: "Maravilhosaa♡"
            },
            {
                name: "Geici",
                meta: "1 avaliação",
                time: "2 anos atrás",
                rating: 5,
                text: "É a melhor 🥰🥰 Atendimento incrível lugar aconchegante Trabalho perfeito ... Mais"
            },
            {
                name: "Gisele Ritta",
                meta: "3 avaliações",
                time: "2 anos atrás",
                rating: 5,
                text: "Ótima profissional, confio e indico. Parabéns pelo teu trabalho!"
            },
            {
                name: "LUIZA SABINO",
                meta: "3 avaliações",
                time: "3 anos atrás",
                rating: 5,
                text: "atendimento maravilhoso!!! trabalho impecável, sem palavras."
            },
            {
                name: "Julia Sabino",
                meta: "6 avaliações · 1 foto",
                time: "2 anos atrás",
                rating: 5,
                text: "Sou cliente a muitos anos, amo e indico para todos! Espaço lindo, sempre limpo e confortável 🤍 ..."
            },
            {
                name: "Natália Turati",
                meta: "3 avaliações",
                time: "Editado 2 anos atrás",
                rating: 5,
                text: "Foi maravilhoso,lugar aconchegante higiênico, e ela é uma profissional de ética, excelente o trabalho dela",
                ownerReply: "Gratidão ♡"
            },
            {
                name: "Carol Ribeiro",
                meta: "3 avaliações",
                time: "2 anos atrás",
                rating: 5,
                text: "Atendimento impecável, lugar aconchegante, música bem agradável ao gosto da cliente!! Eu amo!!",
                ownerReply: "Gratidão ♡"
            },
            {
                name: "Nuriele Dias",
                meta: "9 avaliações",
                time: "2 anos atrás",
                rating: 5,
                text: "Ótima profissional, além de muito querida"
            },
            {
                name: "Rosimeire Padilha",
                meta: "6 avaliações",
                time: "3 anos atrás",
                rating: 5,
                text: "Excelente profissional!! Trabalho com dedicação e amor!! Super indico"
            },
            {
                name: "Grasiely Elisio Trevisan",
                meta: "7 avaliações",
                time: "2 anos atrás",
                rating: 5,
                text: "Um ambiente muito agradável, atendimento especializado, serviço excepcional Recomendo ❤️❤️❤️❤️"
            },
            {
                name: "Nicoly Azevedo de Souza",
                meta: "4 avaliações",
                time: "2 anos atrás",
                rating: 5,
                text: "Atendimento maravilhoso, local super acolhedor e excelente resultado.",
                ownerReply: "Gratidão sua linda♡"
            },
            {
                name: "Barbara Tavares",
                meta: "9 avaliações",
                time: "um ano atrás",
                rating: 5,
                text: "Top! Amamos! Eu e minha filha !🤩🤩🤩 ...",
                ownerReply: "Maravilhosaas🫶🏽🫶🏽 Voltem semrpre😘😘 ..."
            },
            {
                name: "Gabriela Alves",
                meta: "5 avaliações",
                time: "2 anos atrás",
                rating: 5,
                text: "Uma profissional incrível e a melhor play list no ato do procedimento. ❤️"
            },
            {
                name: "cassiakarina1",
                meta: "8 avaliações · 1 foto",
                time: "2 anos atrás",
                rating: 5,
                text: "Excelente profissional! Super indico!",
                ownerReply: "Sua linda♡"
            },
            {
                name: "Elaine Amaral Silva",
                meta: "2 avaliações",
                time: "2 anos atrás",
                rating: 5,
                text: "Maravilhoso excelente trabalho a melhor do mundo 😍 ..."
            },
            {
                name: "Ramon De Souza",
                meta: "10 avaliações · 1 foto",
                time: "3 anos atrás",
                rating: 5,
                text: "Atendimento excelente, ambiente bom demais e gostei a exclusividade!"
            },
            {
                name: "Luciana De Souza (lu)",
                meta: "5 avaliações",
                time: "3 anos atrás",
                rating: 5,
                text: "Dedicação em tudo que faz, simplesmente Maravilhosa, Super recomendo"
            },
            {
                name: "Andrea Aparecida Alves",
                meta: "2 avaliações",
                time: "2 anos atrás",
                rating: 5,
                text: "Super recomendo, para mim é a melhor."
            },
            {
                name: "Dedé Gonçalves",
                meta: "2 avaliações",
                time: "2 anos atrás",
                rating: 5,
                text: "Maravilhosa profissional"
            },
            {
                name: "Luana Beltrame",
                meta: "Local Guide · 20 avaliações · 2 fotos",
                time: "2 anos atrás",
                rating: 5,
                text: "Atendimento impecável"
            },
            {
                name: "Eduarda Freitas",
                meta: "2 avaliações · 1 foto",
                time: "um ano atrás",
                rating: 5,
                text: "Avaliação 5 estrelas sem comentário público."
            },
            {
                name: "Karla Cristine Vicente",
                meta: "2 avaliações",
                time: "2 anos atrás",
                rating: 5,
                text: "Avaliação 5 estrelas sem comentário público.",
                ownerReply: "♡"
            },
            {
                name: "Mariah Cachoeira",
                meta: "1 avaliação",
                time: "2 anos atrás",
                rating: 5,
                text: "Avaliação 5 estrelas sem comentário público.",
                ownerReply: "Gratidão meu bem♡"
            },
            {
                name: "Ramon De Souza",
                meta: "1 avaliação",
                time: "2 anos atrás",
                rating: 5,
                text: "Avaliação 5 estrelas sem comentário público."
            }
        ];

            const fallbackServices = [
                {
                    id: 1,
                    title: 'Microblading',
                    price: 450.00,
                    duration: '120 min',
                    description: 'Técnica realista que desenha fios finíssimos, proporcionando volume e correção de falhas com extrema naturalidade. Arraste a imagem ao lado para ver a transformação.',
                    category: 'Sobrancelhas e Cílios',
                    icon: 'pen-tool',
                    popular: true,
                    media: [
                        'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80',
                        'https://images.unsplash.com/photo-1512496015851-a1fbbfc61a49?auto=format&fit=crop&w=800&q=80'
                    ]
                },
                {
                    id: 2,
                    title: 'Design de Sobrancelhas',
                    price: 50.00,
                    duration: '30 min',
                    category: 'Sobrancelhas e Cílios',
                    icon: 'scissors',
                    popular: true,
                    description: 'Mapeamento facial personalizado para encontrar o desenho perfeito que valoriza a simetria do seu olhar.'
                },
                {
                    id: 3,
                    title: 'Design Masculino',
                    price: 60.00,
                    duration: '30 min',
                    category: 'Sobrancelhas e Cílios',
                    icon: 'user',
                    description: 'Limpeza e alinhamento estratégico dos fios, preservando a naturalidade e a expressividade masculina.'
                },
                {
                    id: 4,
                    title: 'Design com Henna',
                    price: 55.00,
                    duration: '45 min',
                    category: 'Sobrancelhas e Cílios',
                    icon: 'sparkles',
                    description: 'Coloração temporária ideal para preencher falhas, criar volume visual e um efeito maquiado impecável.'
                },
                {
                    id: 5,
                    title: 'Design com Tintura',
                    price: 65.00,
                    duration: '45 min',
                    category: 'Sobrancelhas e Cílios',
                    icon: 'droplet',
                    description: 'Tinge suavemente os fios brancos ou muitos claros, realçando o desenho natural com durabilidade prolongada.'
                },
                {
                    id: 6,
                    title: 'Design + Epilação Facial',
                    price: 55.00,
                    duration: '40 min',
                    description: 'O combo prático essencial: Design de sobrancelhas alinhado com a limpeza suave da região do buço ou queixo.',
                    category: 'Sobrancelhas e Cílios',
                    icon: 'sparkles'
                },
                {
                    id: 7,
                    title: 'Brow Lamination',
                    price: 90.00,
                    duration: '60 min',
                    category: 'Sobrancelhas e Cílios',
                    icon: 'layers',
                    popular: true,
                    description: 'A tendência mundial de alinhamento e texturização que deixa os fios encorpados, penteados para cima e com efeito selvagem chic.'
                },
                {
                    id: 8,
                    title: 'Lash Lifting',
                    price: 90.00,
                    duration: '60 min',
                    category: 'Sobrancelhas e Cílios',
                    icon: 'eye',
                    description: 'Curvatura prolongada e tintura profunda dos seus cílios naturais. Efeito de máscara de cílios (rímel) sem a necessidade de maquiagem.'
                },
                {
                    id: 11,
                    title: 'Axilas',
                    price: 30.00,
                    duration: '20 min',
                    category: 'Epilação Corporal',
                    icon: 'leaf',
                    description: 'Remoção delicada dos pelos das axilas com cera desenvolvida para peles sensíveis.'
                },
                {
                    id: 12,
                    title: 'Virilha Completa',
                    price: 60.00,
                    duration: '40 min',
                    description: 'Epilação minuciosa e confortável de toda a região íntima, garantindo lisura total.',
                    category: 'Epilação Corporal',
                    icon: 'leaf',
                    popular: true
                },
                {
                    id: 17,
                    title: 'Meia Perna',
                    price: 55.00,
                    duration: '30 min',
                    category: 'Epilação Corporal',
                    icon: 'leaf',
                    description: 'Cuidado clássico do joelho aos tornozelos.'
                }
            ];

            let googleReviews = [...fallbackGoogleReviews];
            let services = [...fallbackServices];

            const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

            const dom = {};

            function hasSupabaseConfig() {
                return Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
            }

            function assertSupabaseConfig() {
                if (hasSupabaseConfig()) {
                    return true;
                }

                console.error('Supabase não configurado. Crie app.config.js a partir de app.config.example.js e preencha supabaseUrl e supabaseAnonKey.');
                alert('Configuração do Supabase ausente. Crie o arquivo app.config.js com suas chaves antes de publicar o site.');
                return false;
            }

            const supabase = createSupabaseClient();
            let state = createInitialState();
            let availableDates = [];
            let scrollObserver = null;
            let beforeAfterSliderCleanup = null;
            let availabilityRequestId = 0;

            function createInitialState() {
                return {
                    step: 0,
                    selectedService: null,
                    selectedDate: null,
                    selectedTime: null,
                    activeCategory: 'Todos',
                    availableTimeSlots: [],
                    loadingAvailability: false,
                    isSubmittingBooking: false,
                    bookingResult: null,
                    showAllReviews: false,
                    formData: {
                        name: '',
                        phone: '',
                        notes: ''
                    }
                };
            }

            function createSupabaseClient() {
                const hasWindowClient = window.supabase && typeof window.supabase.createClient === 'function';
                const hasValidKeys = Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey)
                    && !CONFIG.supabaseUrl.includes('COLE_AQUI')
                    && !CONFIG.supabaseAnonKey.includes('COLE_AQUI');

                if (!hasWindowClient || !hasValidKeys) {
                    console.warn('Supabase não configurado. Preencha CONFIG.supabaseUrl e CONFIG.supabaseAnonKey.');
                    return null;
                }

                return window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                });
            }


            async function hydrateDynamicContent() {
                if (!supabase) {
                    return;
                }

                await Promise.allSettled([
                    loadServicesFromSupabase(),
                    loadReviewsFromSupabase()
                ]);
            }

            function normalizeServiceRecord(service) {
                const fallbackMatch = fallbackServices.find((item) => item.id === service.id || item.title === service.title) || {};
                const durationMinutes = Number(service.duration_minutes) || getServiceDurationInMinutes(fallbackMatch) || 0;
                const normalizedPrice = Number(service.price ?? fallbackMatch.price ?? 0);

                return {
                    id: service.id,
                    title: service.title,
                    price: normalizedPrice,
                    duration: durationMinutes > 0 ? `${durationMinutes} min` : (fallbackMatch.duration || 'Consulte'),
                    description: service.description || fallbackMatch.description || '',
                    category: service.category || fallbackMatch.category || 'Serviços',
                    icon: fallbackMatch.icon || 'sparkles',
                    popular: fallbackMatch.popular || false,
                    media: Array.isArray(fallbackMatch.media) ? fallbackMatch.media : []
                };
            }

            async function loadServicesFromSupabase() {
                const { data, error } = await supabase
                    .from('services')
                    .select('id, title, category, description, duration_minutes, price, is_active, sort_order')
                    .eq('is_active', true)
                    .order('sort_order', { ascending: true })
                    .order('title', { ascending: true });

                if (error) {
                    console.error('Erro ao carregar serviços do Supabase:', error);
                    return;
                }

                if (!Array.isArray(data) || data.length === 0) {
                    console.warn('Nenhum serviço ativo encontrado no Supabase. Mantendo catálogo local.');
                    return;
                }

                services = data.map(normalizeServiceRecord);
            }

            function formatRelativeReviewDate(value) {
                if (!value) {
                    return 'recentemente';
                }

                const createdAt = new Date(value);
                if (Number.isNaN(createdAt.getTime())) {
                    return 'recentemente';
                }

                const diffMs = Date.now() - createdAt.getTime();
                const dayMs = 24 * 60 * 60 * 1000;
                const days = Math.max(0, Math.floor(diffMs / dayMs));

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

            function normalizeReviewRecord(review) {
                const name = sanitizeText(review.public_name || 'Cliente');
                const comment = sanitizeText(review.comment || 'Avaliação 5 estrelas sem comentário público.');
                return {
                    name,
                    meta: review.service_title ? `${review.service_title}` : 'Avaliação verificada',
                    time: formatRelativeReviewDate(review.created_at),
                    rating: Number(review.rating) || 5,
                    text: comment,
                    ownerReply: review.admin_reply ? sanitizeText(review.admin_reply) : ''
                };
            }

            async function loadReviewsFromSupabase() {
                const { data, error } = await supabase
                    .from('reviews')
                    .select(`rating, comment, public_name, admin_reply, created_at, service_id, services(title)`)
                    .eq('status', 'approved')
                    .order('is_featured', { ascending: false })
                    .order('created_at', { ascending: false })
                    .limit(29);

                if (error) {
                    console.error('Erro ao carregar avaliações do Supabase:', error);
                    return;
                }

                if (!Array.isArray(data) || data.length === 0) {
                    return;
                }

                googleReviews = data.map((item) => normalizeReviewRecord({
                    ...item,
                    service_title: item.services?.title || ''
                }));
            }

            function formatDateToIso(date) {
                return [
                    date.getFullYear(),
                    String(date.getMonth() + 1).padStart(2, '0'),
                    String(date.getDate()).padStart(2, '0')
                ].join('-');
            }

            function getServiceDurationInMinutes(service) {
                if (!service || !service.duration) {
                    return 0;
                }

                const [durationValue] = String(service.duration).split(' ');
                return Number(durationValue) || 0;
            }

            function sanitizeRpcText(value) {
                return sanitizeText(value).replace(/\s+/g, ' ').trim();
            }

            async function fetchAvailableTimeSlots(date) {
                if (!supabase || !state.selectedService || !date) {
                    return getAvailableTimeSlotsForTodayFallback(date);
                }

                const response = await supabase.rpc('list_available_slots', {
                    p_service_id: state.selectedService.id,
                    p_booking_date: formatDateToIso(date)
                });

                if (response.error) {
                    throw response.error;
                }

                return (response.data || [])
                    .map((item) => item.slot_time)
                    .filter(Boolean);
            }

            function getAvailableTimeSlotsForTodayFallback(date) {
                if (!date) {
                    return [];
                }

                return timeSlots.filter((time) => !isPastTimeSlot(date, time));
            }

            async function refreshAvailabilityForSelectedDate() {
                if (!state.selectedDate) {
                    setState({ availableTimeSlots: [], loadingAvailability: false });
                    renderTimes();
                    return;
                }

                const requestId = ++availabilityRequestId;
                setState({ loadingAvailability: true, selectedTime: null, availableTimeSlots: [] });
                renderTimes();
                syncSummary();

                try {
                    const slots = await fetchAvailableTimeSlots(state.selectedDate.fullDate);

                    if (requestId !== availabilityRequestId) {
                        return;
                    }

                    setState({
                        availableTimeSlots: slots,
                        loadingAvailability: false
                    });
                } catch (error) {
                    console.error('Erro ao buscar disponibilidade:', error);

                    if (requestId !== availabilityRequestId) {
                        return;
                    }

                    setState({
                        availableTimeSlots: getAvailableTimeSlotsForTodayFallback(state.selectedDate.fullDate),
                        loadingAvailability: false
                    });

                    window.alert('Não foi possível consultar a agenda em tempo real. Os horários exibidos abaixo são apenas uma referência local.');
                }

                renderTimes();
                syncSummary();
            }

            async function createBookingRecord(payload) {
                if (!supabase) {
                    throw new Error('Supabase não configurado. Preencha a URL e a anon key antes de publicar.');
                }

                const response = await supabase.rpc('create_public_booking', {
                    p_service_id: payload.serviceId,
                    p_booking_date: payload.bookingDate,
                    p_slot_time: payload.slotTime,
                    p_customer_name: payload.customerName,
                    p_customer_phone: payload.customerPhone,
                    p_customer_notes: payload.customerNotes
                });

                if (response.error) {
                    throw response.error;
                }

                return response.data;
            }

            function cacheDomElements() {
                Object.assign(dom, {
                    year: document.getElementById('year'),
                    categoryFilters: document.getElementById('category-filters'),
                    servicesContainer: document.getElementById('services-container'),
                    instagramGalleryContainer: document.getElementById('instagram-gallery-container'),
                    serviceMediaContainer: document.getElementById('service-media-container'),
                    detailTitle: document.getElementById('detail-title'),
                    detailPrice: document.getElementById('detail-price'),
                    detailDuration: document.getElementById('detail-duration'),
                    detailCategory: document.getElementById('detail-category'),
                    detailDescription: document.getElementById('detail-description'),
                    datesContainer: document.getElementById('dates-container'),
                    timeMessage: document.getElementById('time-message'),
                    timeSection: document.getElementById('time-section'),
                    timesContainer: document.getElementById('times-container'),
                    summaryServiceTitle: document.getElementById('summary-service-title'),
                    formServiceTitle: document.getElementById('form-service-title'),
                    formDateTime: document.getElementById('form-date-time'),
                    formPrice: document.getElementById('form-price'),
                    continueDateButton: document.getElementById('btn-continue-date'),
                    inputName: document.getElementById('input-name'),
                    inputPhone: document.getElementById('input-phone'),
                    inputNotes: document.getElementById('input-notes'),
                    errorName: document.getElementById('error-name'),
                    errorPhone: document.getElementById('error-phone'),
                    whatsappLink: document.getElementById('whatsapp-link'),
                    floatingWhatsapp: document.getElementById('floating-whatsapp'),
                    steps: Array.from(document.querySelectorAll('.step-content'))
                });
            }

            async function initialize() {
                cacheDomElements();
                availableDates = buildAvailableDates();

                await hydrateDynamicContent();

                renderFilters();
                renderServices();
                renderInstagramGallery();
                renderGoogleReviews();

                const googleReviewsToggle = document.getElementById('google-reviews-toggle');
                if (googleReviewsToggle) {
                    googleReviewsToggle.addEventListener('click', toggleGoogleReviews);
                }
                renderDates();
                renderTimes();
                syncSummary();
                syncFooterYear();
                hydrateStoredFormData();
                bindEvents();
                initScrollObserver();
                refreshIcons();
            }

            function bindEvents() {
                if (dom.inputPhone) {
                    dom.inputPhone.addEventListener('input', handlePhoneInput);
                }
            }

            function handlePhoneInput(event) {
                event.target.value = formatPhone(event.target.value);
            }

            function syncFooterYear() {
                if (dom.year) {
                    dom.year.textContent = String(new Date().getFullYear());
                }
            }

            function hydrateStoredFormData() {
                const storedName = localStorage.getItem(STORAGE_KEYS.name) || '';
                const storedPhone = localStorage.getItem(STORAGE_KEYS.phone) || '';

                if (dom.inputName) {
                    dom.inputName.value = storedName;
                }

                if (dom.inputPhone) {
                    dom.inputPhone.value = storedPhone;
                }
            }

            function refreshIcons() {
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
            }

            function initScrollObserver() {
                if (scrollObserver) {
                    scrollObserver.disconnect();
                }

                scrollObserver = new IntersectionObserver(handleRevealEntries, {
                    root: null,
                    rootMargin: '0px',
                    threshold: 0.15
                });

                document.querySelectorAll('.reveal').forEach((element) => {
                    scrollObserver.observe(element);
                });
            }

            function handleRevealEntries(entries, observer) {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                });
            }

            function formatCurrency(value) {
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(value);
            }

            function formatPhone(value) {
                const numericValue = String(value || '').replace(/\D/g, '');
                const matches = numericValue.match(/(\d{0,2})(\d{0,5})(\d{0,4})/);

                if (!matches) {
                    return '';
                }

                if (!matches[2]) {
                    return matches[1];
                }

                return `(${matches[1]}) ${matches[2]}${matches[3] ? `-${matches[3]}` : ''}`;
            }

            function sanitizeText(value) {
                return String(value || '').replace(/[<>]/g, '').trim();
            }

            function isValidPhone(phone) {
                return sanitizeText(phone).length >= MIN_PHONE_LENGTH;
            }

            function isBusinessClosed(date) {
                return CLOSED_WEEKDAYS.has(date.getDay());
            }

            function buildAvailableDates() {
                const dates = [];
                const today = new Date();

                for (let offset = 0; offset < DATE_RANGE_DAYS; offset += 1) {
                    const date = new Date(today);
                    date.setDate(today.getDate() + offset);

                    if (isBusinessClosed(date)) {
                        continue;
                    }

                    dates.push({
                        fullDate: date,
                        day: date.getDate(),
                        weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
                        month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
                    });
                }

                return dates;
            }

            function isSameDay(firstDate, secondDate) {
                if (!firstDate || !secondDate) {
                    return false;
                }

                return firstDate.getDate() === secondDate.getDate()
                    && firstDate.getMonth() === secondDate.getMonth()
                    && firstDate.getFullYear() === secondDate.getFullYear();
            }

            function isToday(date) {
                return isSameDay(date, new Date());
            }

            function isPastTimeSlot(date, time) {
                if (!date || !time || !isToday(date)) {
                    return false;
                }

                const now = new Date();
                const [slotHour, slotMinute] = time.split(':').map(Number);

                return slotHour < now.getHours() || (slotHour === now.getHours() && slotMinute <= now.getMinutes());
            }

            function getVisibleServices() {
                if (state.activeCategory === 'Todos') {
                    return services;
                }

                return services.filter((service) => service.category === state.activeCategory);
            }

            function groupServicesByCategory(serviceList) {
                return serviceList.reduce((accumulator, service) => {
                    if (!accumulator[service.category]) {
                        accumulator[service.category] = [];
                    }

                    accumulator[service.category].push(service);
                    return accumulator;
                }, {});
            }

            function getServiceById(serviceId) {
                return services.find((service) => service.id === serviceId) || null;
            }

            function setState(partialState) {
                state = {
                    ...state,
                    ...partialState,
                    formData: {
                        ...state.formData,
                        ...(partialState.formData || {})
                    }
                };
            }

            function setCategory(category) {
                if (!category || category === state.activeCategory) {
                    if (category) {
                        renderFilters();
                        renderServices();
                    }
                    return;
                }

                setState({ activeCategory: category });
                renderFilters();
                renderServices();
                setTimeout(initScrollObserver, REVEAL_REINIT_DELAY_MS);
            }

            function selectService(serviceId) {
                const service = getServiceById(serviceId);
                if (!service) {
                    return;
                }

                availabilityRequestId += 1;
                setState({
                    selectedService: service,
                    selectedDate: null,
                    selectedTime: null,
                    availableTimeSlots: [],
                    bookingResult: null
                });
                renderServiceDetails();
                renderDates();
                renderTimes();
                syncSummary();
                goToStep('service-details');
            }

            async function selectDate(dateIndex) {
                const selectedDate = availableDates[dateIndex] || null;
                if (!selectedDate) {
                    return;
                }

                setState({
                    selectedDate,
                    selectedTime: null,
                    bookingResult: null
                });

                renderDates();
                await refreshAvailabilityForSelectedDate();
                syncSummary();
            }

            function selectTime(time) {
                if (!time) {
                    return;
                }

                setState({ selectedTime: time });
                renderTimes();
                syncSummary();
            }

            function resolveStepId(step) {
                return STEP_ALIASES[step] || STEP_IDS.home;
            }

            function goToStep(step) {
                const targetStepId = resolveStepId(step);
                const targetStep = document.getElementById(targetStepId);

                if (!targetStep) {
                    return;
                }

                dom.steps.forEach((element) => element.classList.remove('active'));

                setTimeout(() => {
                    targetStep.classList.add('active');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, STEP_ACTIVE_DELAY_MS);

                setState({ step });
                toggleFloatingWhatsapp(step === 0);
            }

            function toggleFloatingWhatsapp(shouldShow) {
                if (!dom.floatingWhatsapp) {
                    return;
                }

                dom.floatingWhatsapp.classList.toggle('translate-y-24', !shouldShow);
                dom.floatingWhatsapp.classList.toggle('opacity-0', !shouldShow);
            }

            function getReviewInitials(name) {
            return name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map(part => part[0].toUpperCase())
                .join('');
        }

        function renderStars(rating) {
            return Array.from({ length: rating }, () => '<i data-lucide="star" class="w-4 h-4 text-yellow-400 fill-current"></i>').join('');
        }

        function getVisibleGoogleReviews() {
            const featuredReviewsLimit = 6;
            return state.showAllReviews ? googleReviews : googleReviews.slice(0, featuredReviewsLimit);
        }

        function updateGoogleReviewsToggle() {
            const toggleButton = document.getElementById('google-reviews-toggle');
            if (!toggleButton) return;

            if (googleReviews.length <= 6) {
                toggleButton.classList.add('hidden');
                return;
            }

            toggleButton.classList.remove('hidden');
            toggleButton.innerHTML = state.showAllReviews
                ? 'Mostrar menos <i data-lucide="chevron-up" class="w-4 h-4 transform transition-transform"></i>'
                : 'Ver mais avaliações <i data-lucide="chevron-down" class="w-4 h-4 transform transition-transform"></i>';
        }

        function toggleGoogleReviews() {
            state.showAllReviews = !state.showAllReviews;
            renderGoogleReviews();
        }

        function renderGoogleReviews() {
            const container = document.getElementById('google-reviews-container');
            if (!container) return;

            container.innerHTML = getVisibleGoogleReviews().map(review => `
                <article class="bg-nude-50 rounded-[2rem] p-6 border border-nude-100 shadow-sm hover:shadow-premium transition-all duration-300 h-full flex flex-col">
                    <div class="flex items-start justify-between gap-4 mb-5">
                        <div class="flex items-center gap-4 min-w-0">
                            <div class="w-12 h-12 rounded-full bg-white border border-nude-200 flex items-center justify-center text-sm font-bold text-stone-700 shrink-0">${getReviewInitials(review.name)}</div>
                            <div class="min-w-0">
                                <h4 class="font-semibold text-stone-800 leading-tight truncate">${review.name}</h4>
                                <p class="text-xs text-stone-400 leading-relaxed">${review.meta}</p>
                            </div>
                        </div>
                        <i data-lucide="quote" class="w-5 h-5 text-rose-300 shrink-0"></i>
                    </div>
                    <div class="flex items-center gap-3 mb-4">
                        <div class="flex items-center gap-1">${renderStars(review.rating)}</div>
                        <span class="text-xs font-medium text-stone-400">${review.time}</span>
                    </div>
                    <p class="text-stone-600 text-sm leading-relaxed font-light flex-1">“${review.text}”</p>
                    ${review.ownerReply ? `<div class="mt-5 pt-4 border-t border-nude-100"><p class="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Resposta do proprietário</p><p class="text-sm text-stone-500 leading-relaxed">${review.ownerReply}</p></div>` : ''}
                </article>
            `).join('');

            updateGoogleReviewsToggle();

            if (window.lucide) {
                lucide.createIcons();
            }
        }

        function renderInstagramGallery() {
                if (!dom.instagramGalleryContainer) {
                    return;
                }

                const markup = instagramPosts.map((post, index) => {
                    const extraClass = index % 2 === 0 ? 'translate-y-8' : '';
                    return `
                        <a href="${post.link}" target="_blank" rel="noopener noreferrer" class="group relative block rounded-3xl overflow-hidden cursor-pointer shadow-sm ${extraClass}">
                            <img src="${post.img}" class="w-full h-40 md:h-56 object-cover transform transition-transform duration-700 group-hover:scale-110" alt="Publicação do Instagram RôSouza Estética">
                            <div class="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                                <i data-lucide="instagram" class="w-8 h-8 mb-2"></i>
                                <span class="text-[10px] font-bold uppercase tracking-widest">Visualizar</span>
                            </div>
                        </a>
                    `;
                }).join('');

                dom.instagramGalleryContainer.innerHTML = markup;
                refreshIcons();
            }

            function renderFilters() {
                if (!dom.categoryFilters) {
                    return;
                }

                const categories = ['Todos', ...new Set(services.map((service) => service.category))];
                const markup = categories.map((category) => renderCategoryFilter(category)).join('');
                dom.categoryFilters.innerHTML = markup;
            }

            function renderCategoryFilter(category) {
                const isActive = state.activeCategory === category;
                const activeClasses = isActive
                    ? 'bg-stone-900 text-white shadow-lg'
                    : 'bg-white text-stone-500 border border-nude-200 hover:border-rose-300 hover:text-rose-600';

                return `
                    <button onclick="setCategory('${category}')" class="whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeClasses}">${category}</button>
                `;
            }

            function renderServices() {
                if (!dom.servicesContainer) {
                    return;
                }

                const servicesByCategory = groupServicesByCategory(getVisibleServices());
                let sectionDelay = 1;

                const markup = Object.entries(servicesByCategory).map(([categoryName, categoryServices]) => {
                    const sectionMarkup = renderServiceCategorySection(categoryName, categoryServices, sectionDelay);
                    sectionDelay += 1;
                    return sectionMarkup;
                }).join('');

                dom.servicesContainer.innerHTML = markup;
                refreshIcons();
            }

            function renderServiceCategorySection(categoryName, categoryServices, delayIndex) {
                const delayClass = `delay-${delayIndex * 100}`;
                const servicesMarkup = categoryServices.map((service) => renderServiceCard(service)).join('');

                return `
                    <div class="reveal ${delayClass}">
                        <div class="mb-8"><h3 class="text-3xl font-serif text-stone-900 pb-4 border-b border-nude-200 inline-block pr-10">${categoryName}</h3></div>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            ${servicesMarkup}
                        </div>
                    </div>
                `;
            }

            function renderServiceCard(service) {
                const popularTag = service.popular
                    ? '<span class="bg-stone-900 text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">Mais procurado</span>'
                    : '<span class="bg-nude-50 text-stone-500 text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest border border-nude-200">Atendimento premium</span>';

                const description = service.description
                    ? `<p class="text-stone-500 text-sm font-light leading-relaxed mb-6 line-clamp-3">${service.description}</p>`
                    : '';

                return `
                    <div onclick="selectService(${service.id})" class="group bg-white rounded-[2rem] p-7 md:p-8 shadow-sm hover:shadow-premium-hover transition-all duration-500 border border-nude-100 hover:border-rose-200 cursor-pointer flex flex-col h-full transform hover:-translate-y-2 relative overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-br from-rose-50/0 via-transparent to-rose-50/70 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <div class="relative z-10 flex-1">
                            <div class="flex justify-between items-start gap-3 mb-6">
                                <div class="w-12 h-12 rounded-2xl bg-nude-50 flex items-center justify-center text-stone-500 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-500"><i data-lucide="${service.icon || 'star'}" class="w-5 h-5 stroke-[1.5]"></i></div>
                                ${popularTag}
                            </div>
                            <h3 class="text-2xl font-serif font-bold text-stone-800 mb-3 group-hover:text-rose-700 transition-colors">${service.title}</h3>
                            ${description}
                            <div class="flex flex-wrap gap-2 mb-6">
                                <span class="inline-flex items-center gap-2 rounded-full bg-nude-50 border border-nude-100 px-3 py-1.5 text-[11px] font-semibold text-stone-500"><i data-lucide="clock-3" class="w-3.5 h-3.5"></i>${service.duration}</span>
                                <span class="inline-flex items-center gap-2 rounded-full bg-nude-50 border border-nude-100 px-3 py-1.5 text-[11px] font-semibold text-stone-500"><i data-lucide="wallet" class="w-3.5 h-3.5"></i>${formatCurrency(service.price)}</span>
                            </div>
                        </div>
                        <div class="relative z-10 flex items-center justify-between gap-4 pt-6 border-t border-nude-100 mt-auto">
                            <div>
                                <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2">Próximo passo</p>
                                <p class="text-sm text-stone-600">Ver detalhes e consultar agenda</p>
                            </div>
                            <div class="w-11 h-11 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 group-hover:border-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300"><i data-lucide="arrow-right" class="w-4 h-4"></i></div>
                        </div>
                    </div>
                `;
            }

            function cleanupBeforeAfterSlider() {
                if (typeof beforeAfterSliderCleanup === 'function') {
                    beforeAfterSliderCleanup();
                    beforeAfterSliderCleanup = null;
                }
            }

            function initBeforeAfterSlider() {
                cleanupBeforeAfterSlider();

                const slider = document.getElementById('ba-slider');
                const beforeImageContainer = document.getElementById('ba-before');
                const handle = document.getElementById('ba-handle');

                if (!slider || !beforeImageContainer || !handle) {
                    return;
                }

                let isDragging = false;

                const moveSlider = (event) => {
                    if (!isDragging) {
                        return;
                    }

                    const rect = slider.getBoundingClientRect();
                    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
                    const positionX = clientX - rect.left;
                    const percentage = Math.max(0, Math.min(100, (positionX / rect.width) * 100));

                    beforeImageContainer.style.width = `${percentage}%`;
                    handle.style.left = `${percentage}%`;
                };

                const startDragging = (event) => {
                    isDragging = true;
                    moveSlider(event);
                };

                const stopDragging = () => {
                    isDragging = false;
                };

                slider.addEventListener('mousedown', startDragging);
                slider.addEventListener('touchstart', startDragging, { passive: true });
                window.addEventListener('mousemove', moveSlider);
                window.addEventListener('touchmove', moveSlider, { passive: true });
                window.addEventListener('mouseup', stopDragging);
                window.addEventListener('touchend', stopDragging);

                beforeAfterSliderCleanup = () => {
                    slider.removeEventListener('mousedown', startDragging);
                    slider.removeEventListener('touchstart', startDragging);
                    window.removeEventListener('mousemove', moveSlider);
                    window.removeEventListener('touchmove', moveSlider);
                    window.removeEventListener('mouseup', stopDragging);
                    window.removeEventListener('touchend', stopDragging);
                };
            }

            function renderServiceDetails() {
                const service = state.selectedService;
                if (!service) {
                    return;
                }

                if (dom.detailTitle) dom.detailTitle.textContent = service.title;
                if (dom.detailPrice) dom.detailPrice.textContent = formatCurrency(service.price);
                if (dom.detailDuration) dom.detailDuration.textContent = service.duration;
                if (dom.detailCategory) dom.detailCategory.textContent = service.category;
                if (dom.detailDescription) dom.detailDescription.textContent = service.description;

                renderServiceMedia(service);
            }

            function renderServiceMedia(service) {
                if (!dom.serviceMediaContainer) {
                    return;
                }

                dom.serviceMediaContainer.style.display = 'block';

                if (Array.isArray(service.media) && service.media.length === 2) {
                    dom.serviceMediaContainer.innerHTML = buildBeforeAfterMarkup(service.media, dom.serviceMediaContainer.offsetWidth || DEFAULT_BEFORE_AFTER_WIDTH);

                    setTimeout(() => {
                        const beforeImage = document.querySelector('#ba-before img');
                        const slider = document.getElementById('ba-slider');

                        if (beforeImage && slider) {
                            beforeImage.style.width = `${slider.offsetWidth}px`;
                        }

                        initBeforeAfterSlider();
                    }, REVEAL_REINIT_DELAY_MS);

                    return;
                }

                cleanupBeforeAfterSlider();

                if (Array.isArray(service.media) && service.media.length === 1) {
                    dom.serviceMediaContainer.innerHTML = `<img src="${service.media[0]}" class="w-full h-full object-cover rounded-3xl transition-transform duration-[10s] hover:scale-105" alt="${service.title}">`;
                    return;
                }

                dom.serviceMediaContainer.innerHTML = `
                    <img src="${PLACEHOLDER_MEDIA_IMAGE}" class="w-full h-full object-cover rounded-3xl opacity-70 grayscale transition-all duration-700 hover:grayscale-0" alt="${service.title}">
                    <div class="absolute inset-0 flex items-center justify-center text-nude-200 pointer-events-none"><i data-lucide="sparkles" class="w-16 h-16 stroke-[1]"></i></div>
                `;
                refreshIcons();
            }

            function buildBeforeAfterMarkup(media, fallbackWidth) {
                return `
                    <div id="ba-slider" class="ba-slider shadow-xl">
                        <img src="${media[0]}" alt="Depois" />
                        <span class="ba-label ba-label-after">Depois</span>
                        <div id="ba-before" class="ba-slider-before">
                            <img src="${media[1]}" alt="Antes" style="width: ${fallbackWidth}px; max-width: none;" />
                            <span class="ba-label ba-label-before">Antes</span>
                        </div>
                        <div id="ba-handle" class="ba-slider-handle"></div>
                    </div>
                `;
            }

            function renderDates() {
                if (!dom.datesContainer) {
                    return;
                }

                const markup = availableDates.map((date, index) => renderDateButton(date, index)).join('');
                dom.datesContainer.innerHTML = markup;
            }

            function renderDateButton(date, index) {
                const isSelected = state.selectedDate && state.selectedDate.fullDate.getTime() === date.fullDate.getTime();
                const activeClass = isSelected
                    ? 'border-stone-900 bg-stone-900 text-white shadow-xl transform scale-105 z-10'
                    : 'border-nude-200 bg-white text-stone-500 hover:border-stone-400';
                const weekdayClass = isSelected ? 'text-stone-300' : 'text-stone-400';

                return `
                    <button onclick="selectDate(${index})" class="flex-shrink-0 w-24 h-28 rounded-[1.5rem] flex flex-col items-center justify-center border transition-all duration-300 ${activeClass}">
                        <span class="text-[10px] uppercase font-bold tracking-widest ${weekdayClass}">${date.weekday}</span>
                        <span class="text-4xl font-serif font-bold my-1 font-numbers">${date.day}</span>
                        <span class="text-[10px] font-bold uppercase tracking-widest opacity-80">${date.month}</span>
                    </button>
                `;
            }

            function getAvailableTimeSlotsForSelectedDate() {
                if (!state.selectedDate) {
                    return [];
                }

                if (state.availableTimeSlots.length) {
                    return state.availableTimeSlots;
                }

                return [];
            }

            function renderTimes() {
                if (!dom.timesContainer || !dom.timeMessage || !dom.timeSection) {
                    return;
                }

                if (!state.selectedDate) {
                    renderEmptyTimeState();
                    return;
                }

                if (state.loadingAvailability) {
                    dom.timesContainer.classList.add('hidden');
                    dom.timesContainer.classList.remove('grid');
                    dom.timeMessage.classList.remove('hidden', 'text-rose-500', 'font-medium');
                    dom.timeMessage.textContent = 'Consultando horários disponíveis em tempo real...';
                    dom.timeSection.classList.remove('opacity-30', 'pointer-events-none');
                    dom.timeSection.classList.add('opacity-100', 'pointer-events-auto');
                    return;
                }

                const availableTimeSlots = getAvailableTimeSlotsForSelectedDate();

                if (!availableTimeSlots.length) {
                    renderFullDayState();
                    return;
                }

                dom.timesContainer.classList.remove('hidden');
                dom.timesContainer.classList.add('grid');
                dom.timeMessage.classList.add('hidden');
                dom.timeSection.classList.remove('opacity-30', 'pointer-events-none');
                dom.timeSection.classList.add('opacity-100', 'pointer-events-auto');
                dom.timeMessage.classList.remove('text-rose-500', 'font-medium');
                dom.timeMessage.textContent = AVAILABLE_TODAY_MESSAGE;
                dom.timesContainer.innerHTML = availableTimeSlots.map((time) => renderTimeButton(time)).join('');
            }

            function renderEmptyTimeState() {
                dom.timesContainer.classList.add('hidden');
                dom.timesContainer.classList.remove('grid');
                dom.timeMessage.classList.remove('hidden', 'text-rose-500', 'font-medium');
                dom.timeMessage.textContent = AVAILABLE_TODAY_MESSAGE;
                dom.timeSection.classList.add('opacity-30', 'pointer-events-none');
                dom.timeSection.classList.remove('opacity-100', 'pointer-events-auto');
            }

            function renderFullDayState() {
                dom.timesContainer.classList.remove('grid');
                dom.timesContainer.classList.add('hidden');
                dom.timeMessage.textContent = FULL_DAY_MESSAGE;
                dom.timeMessage.classList.remove('hidden');
                dom.timeMessage.classList.add('text-rose-500', 'font-medium');
                dom.timeSection.classList.remove('opacity-30', 'pointer-events-none');
                dom.timeSection.classList.add('opacity-100', 'pointer-events-auto');
            }

            function renderTimeButton(time) {
                const isSelected = state.selectedTime === time;
                const activeClass = isSelected
                    ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200/50 transform scale-105'
                    : 'bg-white border-nude-200 text-stone-600 hover:border-stone-400';

                return `
                    <button onclick="selectTime('${time}')" class="py-4 px-2 rounded-2xl text-[15px] font-bold font-numbers tracking-wide border transition-all duration-300 ${activeClass}">${time}</button>
                `;
            }

            function syncSummary() {
                if (state.selectedService) {
                    if (dom.summaryServiceTitle) dom.summaryServiceTitle.textContent = state.selectedService.title;
                    if (dom.formServiceTitle) dom.formServiceTitle.textContent = state.selectedService.title;
                    if (dom.formPrice) dom.formPrice.textContent = formatCurrency(state.selectedService.price);
                }

                if (state.selectedDate && state.selectedTime && dom.formDateTime) {
                    dom.formDateTime.textContent = `${state.selectedDate.day}/${state.selectedDate.month} às ${state.selectedTime}`;
                }

                syncContinueButtonState();
                syncSuccessState();
            }

            function syncContinueButtonState() {
                if (!dom.continueDateButton) {
                    return;
                }

                const canProceed = Boolean(state.selectedDate && state.selectedTime);
                dom.continueDateButton.disabled = !canProceed;
                dom.continueDateButton.className = canProceed ? CONTINUE_BUTTON_ENABLED_CLASS : CONTINUE_BUTTON_DISABLED_CLASS;
            }

            function syncSuccessState() {
                if (!dom.whatsappLink || !state.selectedService || !state.selectedDate || !state.selectedTime) {
                    return;
                }

                dom.whatsappLink.href = buildWhatsappLink();
            }

            function showFieldError(input, errorElement, shouldShow) {
                if (!input || !errorElement) {
                    return;
                }

                errorElement.classList.toggle('hidden', !shouldShow);
                input.classList.toggle('border-rose-500', shouldShow);
            }

            function validateBookingForm() {
                const sanitizedName = sanitizeText(dom.inputName ? dom.inputName.value : '');
                const formattedPhone = formatPhone(dom.inputPhone ? dom.inputPhone.value : '');
                const sanitizedNotes = sanitizeText(dom.inputNotes ? dom.inputNotes.value : '');

                const nameIsValid = Boolean(sanitizedName);
                const phoneIsValid = isValidPhone(formattedPhone);

                showFieldError(dom.inputName, dom.errorName, !nameIsValid);
                showFieldError(dom.inputPhone, dom.errorPhone, !phoneIsValid);

                if (!nameIsValid || !phoneIsValid) {
                    return null;
                }

                return {
                    name: sanitizedName,
                    phone: formattedPhone,
                    notes: sanitizedNotes
                };
            }

            function persistFormData(formData) {
                localStorage.setItem(STORAGE_KEYS.name, formData.name);
                localStorage.setItem(STORAGE_KEYS.phone, formData.phone);
            }

            function buildWhatsappMessage() {
                const notes = state.formData.notes || EMPTY_NOTES_LABEL;
                return [
                    'Oi Rô! Tudo bem? 🥰 Gostaria de confirmar meu momento de autocuidado na *' + CONFIG.businessName + '*:',
                    '',
                    '✨ *O que vamos fazer:* ' + state.selectedService.title,
                    `📅 *Quando:* ${state.selectedDate.day}/${state.selectedDate.month} (${state.selectedDate.weekday})`,
                    `⏰ *Que horas:* ${state.selectedTime}`,
                    '',
                    `👤 *Meu nome é:* ${state.formData.name}`,
                    `📱 *Meu WhatsApp:* ${state.formData.phone}`,
                    `📝 *Observações:* ${notes}`
                ].join('\n');
            }

            function buildWhatsappLink() {
                return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(buildWhatsappMessage())}`;
            }

            async function submitBooking() {
                if (!assertSupabaseConfig()) return;
                if (!state.selectedService || !state.selectedDate || !state.selectedTime) {
                    return;
                }

                if (state.isSubmittingBooking) {
                    return;
                }

                const formData = validateBookingForm();
                if (!formData) {
                    return;
                }

                if (dom.inputPhone) {
                    dom.inputPhone.value = formData.phone;
                }

                const bookingPayload = {
                    serviceId: state.selectedService.id,
                    bookingDate: formatDateToIso(state.selectedDate.fullDate),
                    slotTime: state.selectedTime,
                    customerName: sanitizeRpcText(formData.name),
                    customerPhone: sanitizeRpcText(formData.phone),
                    customerNotes: sanitizeRpcText(formData.notes)
                };

                setState({ isSubmittingBooking: true });

                try {
                    const bookingResult = await createBookingRecord(bookingPayload);

                    if (!bookingResult || bookingResult.success !== true) {
                        if (bookingResult && bookingResult.code === 'TIME_SLOT_UNAVAILABLE') {
                            window.alert('Esse horário acabou de ser reservado por outra cliente. Escolha um novo horário.');
                            await refreshAvailabilityForSelectedDate();
                            goToStep(1);
                            return;
                        }

                        throw new Error((bookingResult && bookingResult.message) || 'Não foi possível registrar o agendamento.');
                    }

                    setState({
                        formData,
                        bookingResult,
                        isSubmittingBooking: false
                    });

                    persistFormData(formData);
                    syncSummary();
                    goToStep(3);
                } catch (error) {
                    console.error('Erro ao criar agendamento:', error);
                    setState({ isSubmittingBooking: false });
                    window.alert(error.message || 'Erro ao registrar o agendamento. Tente novamente.');
                }
            }

            function buildCalendarDateRange() {
                if (!state.selectedDate || !state.selectedTime || !state.selectedService) {
                    return null;
                }

                const [hours, minutes] = state.selectedTime.split(':').map(Number);
                const [durationValue] = state.selectedService.duration.split(' ');
                const durationMinutes = Number(durationValue) || 0;

                const startDate = new Date(state.selectedDate.fullDate);
                startDate.setHours(hours, minutes, 0, 0);

                const endDate = new Date(startDate);
                endDate.setMinutes(endDate.getMinutes() + durationMinutes);

                return { startDate, endDate };
            }

            function formatCalendarDate(date) {
                const pad = (value) => String(value).padStart(2, '0');
                return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
            }

            function buildAppointmentTitle() {
                if (!state.selectedService) {
                    return CONFIG.businessName;
                }

                return `${state.selectedService.title} - ${CONFIG.businessName}`;
            }

            function buildAppointmentDescription() {
                const customerName = state.formData.name ? `Cliente: ${state.formData.name}` : '';
                const notes = state.formData.notes ? `Observações: ${state.formData.notes}` : '';
                return [customerName, notes].filter(Boolean).join('\n');
            }

            function addToGoogleCalendar() {
                const calendarRange = buildCalendarDateRange();
                if (!calendarRange) {
                    return;
                }

                const url = new URL('https://calendar.google.com/calendar/render');
                url.searchParams.set('action', 'TEMPLATE');
                url.searchParams.set('text', buildAppointmentTitle());
                url.searchParams.set('dates', `${formatCalendarDate(calendarRange.startDate)}/${formatCalendarDate(calendarRange.endDate)}`);
                url.searchParams.set('location', CONFIG.address);
                url.searchParams.set('details', buildAppointmentDescription());
                window.open(url.toString(), '_blank', 'noopener,noreferrer');
            }

            function downloadICS() {
                const calendarRange = buildCalendarDateRange();
                if (!calendarRange) {
                    return;
                }

                const icsLines = [
                    'BEGIN:VCALENDAR',
                    'VERSION:2.0',
                    'PRODID:-//RôSouza Estética//Agendamento//PT-BR',
                    'BEGIN:VEVENT',
                    `UID:${Date.now()}@rosouza-estetica`,
                    `DTSTAMP:${formatCalendarDate(new Date())}`,
                    `DTSTART:${formatCalendarDate(calendarRange.startDate)}`,
                    `DTEND:${formatCalendarDate(calendarRange.endDate)}`,
                    `SUMMARY:${buildAppointmentTitle()}`,
                    `DESCRIPTION:${buildAppointmentDescription().replace(/\n/g, '\\n')}`,
                    `LOCATION:${CONFIG.address}`,
                    'END:VEVENT',
                    'END:VCALENDAR'
                ];

                const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
                const fileUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = fileUrl;
                link.download = 'agendamento-rosouza.ics';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(fileUrl);
            }

            function resetApp() {
                state = createInitialState();

                if (dom.inputName) {
                    dom.inputName.value = localStorage.getItem(STORAGE_KEYS.name) || '';
                    dom.inputName.classList.remove('border-rose-500');
                }

                if (dom.inputPhone) {
                    dom.inputPhone.value = localStorage.getItem(STORAGE_KEYS.phone) || '';
                    dom.inputPhone.classList.remove('border-rose-500');
                }

                if (dom.inputNotes) {
                    dom.inputNotes.value = '';
                }

                if (dom.errorName) {
                    dom.errorName.classList.add('hidden');
                }

                if (dom.errorPhone) {
                    dom.errorPhone.classList.add('hidden');
                }

                renderDates();
                renderTimes();
                renderFilters();
                renderServices();
                syncSummary();
                goToStep(0);
                cleanupBeforeAfterSlider();
                setTimeout(initScrollObserver, REVEAL_REINIT_DELAY_MS);
            }

            return {
                initialize,
                setCategory,
                selectService,
                selectDate,
                selectTime,
                goToStep,
                submitBooking,
                resetApp,
                addToGoogleCalendar,
                downloadICS
            };
        })();

        window.setCategory = App.setCategory;
        window.selectService = App.selectService;
        window.selectDate = App.selectDate;
        window.selectTime = App.selectTime;
        window.goToStep = App.goToStep;
        window.submitBooking = App.submitBooking;
        window.resetApp = App.resetApp;
        window.addToGoogleCalendar = App.addToGoogleCalendar;
        window.downloadICS = App.downloadICS;

        document.addEventListener('DOMContentLoaded', App.initialize);
