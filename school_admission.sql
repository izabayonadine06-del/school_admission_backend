--
-- PostgreSQL database dump
--

\restrict wNJBw52VRHFZZgk2rTOZ2eZzLHXlaxLB5Hag4TkXqNVT6fd3l8V9lAwOxqulCVE

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-10-18 06:30:33

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 242 (class 1259 OID 16702)
-- Name: account_setup_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_setup_tokens (
    token_hash character(64) NOT NULL,
    user_id bigint NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.account_setup_tokens OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16598)
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id bigint NOT NULL,
    user_id bigint,
    action character varying(80) NOT NULL,
    entity_type character varying(80) NOT NULL,
    entity_id bigint,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16597)
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5214 (class 0 OID 0)
-- Dependencies: 236
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- TOC entry 229 (class 1259 OID 16504)
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id bigint NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    author_id bigint NOT NULL,
    published_at timestamp with time zone,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16503)
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.announcements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO postgres;

--
-- TOC entry 5215 (class 0 OID 0)
-- Dependencies: 228
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- TOC entry 225 (class 1259 OID 16442)
-- Name: applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications (
    id bigint NOT NULL,
    reference_number character varying(32) NOT NULL,
    student_id bigint NOT NULL,
    requested_class character varying(100) NOT NULL,
    status character varying(30) DEFAULT 'PENDING'::character varying NOT NULL,
    reviewer_id bigint,
    decision_comment text,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    decision_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    level character varying(20) DEFAULT 'L3'::character varying NOT NULL,
    admission_year integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer NOT NULL,
    CONSTRAINT applications_admission_year_check CHECK (((admission_year >= 2020) AND (admission_year <= 2100))),
    CONSTRAINT applications_level_check CHECK (((level)::text = ANY ((ARRAY['L3'::character varying, 'L4'::character varying, 'L5'::character varying, 'UNSPECIFIED'::character varying])::text[]))),
    CONSTRAINT applications_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'UNDER_REVIEW'::character varying, 'REQUIRES_CORRECTION'::character varying, 'ACCEPTED'::character varying, 'REJECTED'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE public.applications OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16441)
-- Name: applications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applications_id_seq OWNER TO postgres;

--
-- TOC entry 5216 (class 0 OID 0)
-- Dependencies: 224
-- Name: applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applications_id_seq OWNED BY public.applications.id;


--
-- TOC entry 227 (class 1259 OID 16478)
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id bigint NOT NULL,
    application_id bigint NOT NULL,
    document_type character varying(80) NOT NULL,
    storage_key text NOT NULL,
    original_filename character varying(255) NOT NULL,
    mime_type character varying(120) NOT NULL,
    verification_status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT documents_verification_status_check CHECK (((verification_status)::text = ANY ((ARRAY['PENDING'::character varying, 'VERIFIED'::character varying, 'REJECTED'::character varying])::text[])))
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16477)
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- TOC entry 5217 (class 0 OID 0)
-- Dependencies: 226
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- TOC entry 231 (class 1259 OID 16528)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id bigint NOT NULL,
    sender_id bigint NOT NULL,
    recipient_id bigint NOT NULL,
    conversation_id uuid NOT NULL,
    content text NOT NULL,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone,
    CONSTRAINT messages_check CHECK ((sender_id <> recipient_id))
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16527)
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- TOC entry 5218 (class 0 OID 0)
-- Dependencies: 230
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- TOC entry 233 (class 1259 OID 16556)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    recipient_id bigint NOT NULL,
    notification_type character varying(60) NOT NULL,
    message text NOT NULL,
    related_record_type character varying(60),
    related_record_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    read_at timestamp with time zone
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16555)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- TOC entry 5219 (class 0 OID 0)
-- Dependencies: 232
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 241 (class 1259 OID 16662)
-- Name: public_admission_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.public_admission_documents (
    id bigint NOT NULL,
    request_id bigint NOT NULL,
    document_type character varying(80) NOT NULL,
    storage_key text NOT NULL,
    original_filename character varying(255) NOT NULL,
    mime_type character varying(120) NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.public_admission_documents OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 16661)
-- Name: public_admission_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.public_admission_documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.public_admission_documents_id_seq OWNER TO postgres;

--
-- TOC entry 5220 (class 0 OID 0)
-- Dependencies: 240
-- Name: public_admission_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.public_admission_documents_id_seq OWNED BY public.public_admission_documents.id;


--
-- TOC entry 239 (class 1259 OID 16630)
-- Name: public_admission_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.public_admission_requests (
    id bigint NOT NULL,
    reference_number character varying(32) NOT NULL,
    parent_name character varying(160) NOT NULL,
    parent_email character varying(254) NOT NULL,
    parent_phone character varying(32),
    parent_address text,
    student_name character varying(160) NOT NULL,
    date_of_birth date NOT NULL,
    gender character varying(30),
    student_address text,
    previous_school character varying(200),
    requested_class character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    reviewer_id bigint,
    decision_comment text,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    decision_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    parent_user_id bigint,
    student_id bigint,
    application_id bigint,
    level character varying(20) DEFAULT 'L3'::character varying NOT NULL,
    CONSTRAINT public_admission_requests_level_check CHECK (((level)::text = ANY ((ARRAY['L3'::character varying, 'L4'::character varying, 'L5'::character varying, 'UNSPECIFIED'::character varying])::text[]))),
    CONSTRAINT public_admission_requests_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'UNDER_REVIEW'::character varying, 'REQUIRES_CORRECTION'::character varying, 'ACCEPTED'::character varying, 'REJECTED'::character varying])::text[])))
);


ALTER TABLE public.public_admission_requests OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16629)
-- Name: public_admission_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.public_admission_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.public_admission_requests_id_seq OWNER TO postgres;

--
-- TOC entry 5221 (class 0 OID 0)
-- Dependencies: 238
-- Name: public_admission_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.public_admission_requests_id_seq OWNED BY public.public_admission_requests.id;


--
-- TOC entry 219 (class 1259 OID 16389)
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_migrations (
    version character varying(255) NOT NULL,
    applied_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16577)
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    token_hash character(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16576)
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sessions_id_seq OWNER TO postgres;

--
-- TOC entry 5222 (class 0 OID 0)
-- Dependencies: 234
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- TOC entry 223 (class 1259 OID 16419)
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id bigint NOT NULL,
    parent_id bigint NOT NULL,
    full_name character varying(160) NOT NULL,
    date_of_birth date NOT NULL,
    gender character varying(30),
    address text,
    previous_school character varying(200),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.students OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16418)
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.students_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO postgres;

--
-- TOC entry 5223 (class 0 OID 0)
-- Dependencies: 222
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- TOC entry 244 (class 1259 OID 16731)
-- Name: trade_capacities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trade_capacities (
    id bigint NOT NULL,
    admission_year integer NOT NULL,
    requested_class character varying(100) NOT NULL,
    level character varying(20) NOT NULL,
    capacity integer NOT NULL,
    updated_by bigint,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT trade_capacities_admission_year_check CHECK (((admission_year >= 2020) AND (admission_year <= 2100))),
    CONSTRAINT trade_capacities_capacity_check CHECK (((capacity >= 0) AND (capacity <= 10000))),
    CONSTRAINT trade_capacities_level_check CHECK (((level)::text = ANY ((ARRAY['L3'::character varying, 'L4'::character varying, 'L5'::character varying])::text[])))
);


ALTER TABLE public.trade_capacities OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 16730)
-- Name: trade_capacities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.trade_capacities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.trade_capacities_id_seq OWNER TO postgres;

--
-- TOC entry 5224 (class 0 OID 0)
-- Dependencies: 243
-- Name: trade_capacities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.trade_capacities_id_seq OWNED BY public.trade_capacities.id;


--
-- TOC entry 221 (class 1259 OID 16398)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    full_name character varying(160) NOT NULL,
    email character varying(254) NOT NULL,
    phone character varying(32),
    password_hash text NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    address text,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['PARENT'::character varying, 'HEADTEACHER'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16397)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5225 (class 0 OID 0)
-- Dependencies: 220
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4946 (class 2604 OID 16601)
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- TOC entry 4936 (class 2604 OID 16507)
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- TOC entry 4926 (class 2604 OID 16445)
-- Name: applications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications ALTER COLUMN id SET DEFAULT nextval('public.applications_id_seq'::regclass);


--
-- TOC entry 4933 (class 2604 OID 16481)
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- TOC entry 4940 (class 2604 OID 16531)
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- TOC entry 4942 (class 2604 OID 16559)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 4954 (class 2604 OID 16665)
-- Name: public_admission_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_admission_documents ALTER COLUMN id SET DEFAULT nextval('public.public_admission_documents_id_seq'::regclass);


--
-- TOC entry 4949 (class 2604 OID 16633)
-- Name: public_admission_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_admission_requests ALTER COLUMN id SET DEFAULT nextval('public.public_admission_requests_id_seq'::regclass);


--
-- TOC entry 4944 (class 2604 OID 16580)
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- TOC entry 4923 (class 2604 OID 16422)
-- Name: students id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- TOC entry 4957 (class 2604 OID 16734)
-- Name: trade_capacities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trade_capacities ALTER COLUMN id SET DEFAULT nextval('public.trade_capacities_id_seq'::regclass);


--
-- TOC entry 4920 (class 2604 OID 16401)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5206 (class 0 OID 16702)
-- Dependencies: 242
-- Data for Name: account_setup_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account_setup_tokens (token_hash, user_id, expires_at, created_at) FROM stdin;
\.


--
-- TOC entry 5201 (class 0 OID 16598)
-- Dependencies: 237
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, user_id, action, entity_type, entity_id, details, created_at) FROM stdin;
1	2	ANNOUNCEMENT_CREATED	ANNOUNCEMENT	1	{"published": true}	2026-10-15 07:43:26.065626+14
7	2	ANNOUNCEMENT_CREATED	ANNOUNCEMENT	2	{"published": true}	2026-10-15 22:02:35.101135+14
8	2	ANNOUNCEMENT_PUBLISH_STATUS_CHANGED	ANNOUNCEMENT	2	{"published": false}	2026-10-15 22:03:56.386215+14
9	2	ANNOUNCEMENT_PUBLISH_STATUS_CHANGED	ANNOUNCEMENT	2	{"published": true}	2026-10-15 22:04:13.02199+14
47	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	1	{"level": "L3", "capacity": 10, "admissionYear": 2026, "requestedClass": "Software Development"}	2026-10-18 04:32:31.660498+14
48	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	2	{"level": "L3", "capacity": 10, "admissionYear": 2026, "requestedClass": "Networking And Internet Technology"}	2026-10-18 04:32:39.54847+14
49	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	3	{"level": "L3", "capacity": 7, "admissionYear": 2026, "requestedClass": "Computer Systems And Architecture"}	2026-10-18 04:32:46.868919+14
50	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	4	{"level": "L3", "capacity": 1, "admissionYear": 2026, "requestedClass": "Accounting"}	2026-10-18 04:32:53.124687+14
51	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	5	{"level": "L3", "capacity": 21, "admissionYear": 2026, "requestedClass": "Building Construction"}	2026-10-18 04:33:03.277946+14
52	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	6	{"level": "L3", "capacity": 20, "admissionYear": 2026, "requestedClass": "Electronics And Telecommunication"}	2026-10-18 04:33:10.117446+14
53	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	7	{"level": "L3", "capacity": 3, "admissionYear": 2026, "requestedClass": "Electrical Technology"}	2026-10-18 04:33:16.348948+14
54	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	8	{"level": "L5", "capacity": 2, "admissionYear": 2026, "requestedClass": "Software Development"}	2026-10-18 04:34:43.814861+14
55	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	9	{"level": "L5", "capacity": 12, "admissionYear": 2026, "requestedClass": "Accounting"}	2026-10-18 04:34:58.820885+14
56	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	10	{"level": "L4", "capacity": 5, "admissionYear": 2026, "requestedClass": "Building Construction"}	2026-10-18 04:35:09.426462+14
57	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	4	{"level": "L3", "capacity": 100, "admissionYear": 2026, "requestedClass": "Accounting"}	2026-10-18 04:38:13.377832+14
58	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	9	{"level": "L5", "capacity": 50, "admissionYear": 2026, "requestedClass": "Accounting"}	2026-10-18 04:38:35.1976+14
59	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	5	{"level": "L3", "capacity": 30, "admissionYear": 2026, "requestedClass": "Building Construction"}	2026-10-18 04:39:06.294633+14
60	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	10	{"level": "L4", "capacity": 20, "admissionYear": 2026, "requestedClass": "Building Construction"}	2026-10-18 04:39:14.107214+14
61	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	3	{"level": "L3", "capacity": 20, "admissionYear": 2026, "requestedClass": "Computer Systems And Architecture"}	2026-10-18 04:39:21.504375+14
62	2	TRADE_CAPACITY_UPDATED	TRADE_CAPACITY	7	{"level": "L3", "capacity": 30, "admissionYear": 2026, "requestedClass": "Electrical Technology"}	2026-10-18 04:39:38.388837+14
\.


--
-- TOC entry 5193 (class 0 OID 16504)
-- Dependencies: 229
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, title, content, author_id, published_at, is_published, created_at, updated_at) FROM stdin;
1	School announcement	The school will reopen on Monday.	2	2026-10-15 07:43:26.046775+14	t	2026-10-15 07:43:26.046775+14	2026-10-15 07:43:26.046775+14
2	inama	inama yababyeyi	2	2026-10-15 22:04:13.00907+14	t	2026-10-15 22:02:35.063674+14	2026-10-15 22:04:13.00907+14
\.


--
-- TOC entry 5189 (class 0 OID 16442)
-- Dependencies: 225
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications (id, reference_number, student_id, requested_class, status, reviewer_id, decision_comment, submitted_at, decision_at, created_at, updated_at, level, admission_year) FROM stdin;
\.


--
-- TOC entry 5191 (class 0 OID 16478)
-- Dependencies: 227
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, application_id, document_type, storage_key, original_filename, mime_type, verification_status, uploaded_at) FROM stdin;
\.


--
-- TOC entry 5195 (class 0 OID 16528)
-- Dependencies: 231
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, sender_id, recipient_id, conversation_id, content, sent_at, read_at) FROM stdin;
\.


--
-- TOC entry 5197 (class 0 OID 16556)
-- Dependencies: 233
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, recipient_id, notification_type, message, related_record_type, related_record_id, created_at, read_at) FROM stdin;
\.


--
-- TOC entry 5205 (class 0 OID 16662)
-- Dependencies: 241
-- Data for Name: public_admission_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.public_admission_documents (id, request_id, document_type, storage_key, original_filename, mime_type, uploaded_at) FROM stdin;
\.


--
-- TOC entry 5203 (class 0 OID 16630)
-- Dependencies: 239
-- Data for Name: public_admission_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.public_admission_requests (id, reference_number, parent_name, parent_email, parent_phone, parent_address, student_name, date_of_birth, gender, student_address, previous_school, requested_class, status, reviewer_id, decision_comment, submitted_at, decision_at, created_at, parent_user_id, student_id, application_id, level) FROM stdin;
\.


--
-- TOC entry 5183 (class 0 OID 16389)
-- Dependencies: 219
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schema_migrations (version, applied_at) FROM stdin;
001_initial_schema.sql	2026-10-15 07:00:57.987818+14
002_add_parent_address.sql	2026-10-15 07:19:37.189283+14
003_public_admissions.sql	2026-10-16 04:11:05.508803+14
004_public_admission_accounts.sql	2026-10-16 05:07:28.295389+14
005_public_admission_review_statuses.sql	2026-10-16 23:02:10.463973+14
006_application_levels.sql	2026-10-16 23:02:10.463973+14
007_application_cancellation.sql	2026-10-17 23:37:45.861092+14
008_trade_capacity_by_year.sql	2026-10-17 23:37:45.861092+14
\.


--
-- TOC entry 5199 (class 0 OID 16577)
-- Dependencies: 235
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, token_hash, expires_at, created_at) FROM stdin;
3	2	b7fe3451de0f4608fbb74f0a49cde3e4e446c1c310203a4e6dcee08e6456341c	2026-10-22 07:41:46.831331+14	2026-10-15 07:41:46.831331+14
15	2	97a89e886db88319bfa215d76d0d345557257735f363d04066d2a5662d007e92	2026-10-23 04:16:49.342922+14	2026-10-16 04:16:49.342922+14
16	2	e2ff0f53c3ba3d65941b1f1213cf1bfcaabe83c54adc82bcae7cb57cd5d973fd	2026-10-23 04:17:26.325203+14	2026-10-16 04:17:26.325203+14
21	2	ea00d2a939d412430e828103080f3b2d05ffdc72000c58caff7e92919782957d	2026-10-23 07:33:41.922857+14	2026-10-16 07:33:41.922857+14
22	2	755c5dd37cbbadf592e3344ce7eb4f1a7e112c813ab83518fac4ff116cd26586	2026-10-23 07:42:13.06885+14	2026-10-16 07:42:13.06885+14
24	2	3822f56422ac8e0be958c5fff482a97c3ae26b72aa7919fc884232a69f0d2dcc	2026-10-23 22:24:25.185892+14	2026-10-16 22:24:25.185892+14
30	2	11d722977dbe14364e8b663d07f45423c182e52671dec7ebe2059bed134bce58	2026-10-24 02:35:39.214213+14	2026-10-17 02:35:39.214213+14
32	2	8082bc9c1efa56b919f86e84c6a123a4c2e3388fda392d853bb0d98461be3307	2026-10-24 04:15:01.640937+14	2026-10-17 04:15:01.640937+14
35	2	9b6d028e5b98195aaa1b0576dfee9bafbe3543d8b53d765fa20c21e20991af2d	2026-10-25 03:51:34.551186+14	2026-10-18 03:51:34.551186+14
\.


--
-- TOC entry 5187 (class 0 OID 16419)
-- Dependencies: 223
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, parent_id, full_name, date_of_birth, gender, address, previous_school, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5208 (class 0 OID 16731)
-- Dependencies: 244
-- Data for Name: trade_capacities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trade_capacities (id, admission_year, requested_class, level, capacity, updated_by, updated_at) FROM stdin;
1	2026	Software Development	L3	10	2	2026-10-18 04:32:31.638063+14
2	2026	Networking And Internet Technology	L3	10	2	2026-10-18 04:32:39.537831+14
6	2026	Electronics And Telecommunication	L3	20	2	2026-10-18 04:33:10.110803+14
8	2026	Software Development	L5	2	2	2026-10-18 04:34:43.810452+14
4	2026	Accounting	L3	100	2	2026-10-18 04:38:13.370591+14
9	2026	Accounting	L5	50	2	2026-10-18 04:38:35.193651+14
5	2026	Building Construction	L3	30	2	2026-10-18 04:39:06.290213+14
10	2026	Building Construction	L4	20	2	2026-10-18 04:39:14.104574+14
3	2026	Computer Systems And Architecture	L3	20	2	2026-10-18 04:39:21.499063+14
7	2026	Electrical Technology	L3	30	2	2026-10-18 04:39:38.383987+14
\.


--
-- TOC entry 5185 (class 0 OID 16398)
-- Dependencies: 221
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, full_name, email, phone, password_hash, role, created_at, updated_at, address) FROM stdin;
2	Havugimana Jean Damour	damour@gmail.com	798765432	scrypt$370eef951394690dfdd2922399277cae$abb047e8e4424ac0bc80097a07d84aa9956f04ed64556a49910cd50bcb0955697b2d6ec2471483d197095826079cee380532c788c11d1b9ccbbacb814856d4b9	HEADTEACHER	2026-10-15 07:37:56.859323+14	2026-10-15 07:37:56.859323+14	huye
\.


--
-- TOC entry 5226 (class 0 OID 0)
-- Dependencies: 236
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 62, true);


--
-- TOC entry 5227 (class 0 OID 0)
-- Dependencies: 228
-- Name: announcements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.announcements_id_seq', 2, true);


--
-- TOC entry 5228 (class 0 OID 0)
-- Dependencies: 224
-- Name: applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applications_id_seq', 11, true);


--
-- TOC entry 5229 (class 0 OID 0)
-- Dependencies: 226
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 44, true);


--
-- TOC entry 5230 (class 0 OID 0)
-- Dependencies: 230
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 7, true);


--
-- TOC entry 5231 (class 0 OID 0)
-- Dependencies: 232
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 30, true);


--
-- TOC entry 5232 (class 0 OID 0)
-- Dependencies: 240
-- Name: public_admission_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.public_admission_documents_id_seq', 48, true);


--
-- TOC entry 5233 (class 0 OID 0)
-- Dependencies: 238
-- Name: public_admission_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.public_admission_requests_id_seq', 12, true);


--
-- TOC entry 5234 (class 0 OID 0)
-- Dependencies: 234
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 37, true);


--
-- TOC entry 5235 (class 0 OID 0)
-- Dependencies: 222
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_id_seq', 10, true);


--
-- TOC entry 5236 (class 0 OID 0)
-- Dependencies: 243
-- Name: trade_capacities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.trade_capacities_id_seq', 16, true);


--
-- TOC entry 5237 (class 0 OID 0)
-- Dependencies: 220
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- TOC entry 5013 (class 2606 OID 16711)
-- Name: account_setup_tokens account_setup_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_setup_tokens
    ADD CONSTRAINT account_setup_tokens_pkey PRIMARY KEY (token_hash);


--
-- TOC entry 5003 (class 2606 OID 16612)
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4989 (class 2606 OID 16521)
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- TOC entry 4980 (class 2606 OID 16462)
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- TOC entry 4982 (class 2606 OID 16464)
-- Name: applications applications_reference_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_reference_number_key UNIQUE (reference_number);


--
-- TOC entry 4987 (class 2606 OID 16496)
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- TOC entry 4992 (class 2606 OID 16543)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4994 (class 2606 OID 16569)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5011 (class 2606 OID 16677)
-- Name: public_admission_documents public_admission_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_admission_documents
    ADD CONSTRAINT public_admission_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 5006 (class 2606 OID 16651)
-- Name: public_admission_requests public_admission_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_admission_requests
    ADD CONSTRAINT public_admission_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 5008 (class 2606 OID 16653)
-- Name: public_admission_requests public_admission_requests_reference_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_admission_requests
    ADD CONSTRAINT public_admission_requests_reference_number_key UNIQUE (reference_number);


--
-- TOC entry 4971 (class 2606 OID 16396)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 4997 (class 2606 OID 16588)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4999 (class 2606 OID 16590)
-- Name: sessions sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_token_hash_key UNIQUE (token_hash);


--
-- TOC entry 4978 (class 2606 OID 16434)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- TOC entry 5016 (class 2606 OID 16748)
-- Name: trade_capacities trade_capacities_admission_year_requested_class_level_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trade_capacities
    ADD CONSTRAINT trade_capacities_admission_year_requested_class_level_key UNIQUE (admission_year, requested_class, level);


--
-- TOC entry 5018 (class 2606 OID 16746)
-- Name: trade_capacities trade_capacities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trade_capacities
    ADD CONSTRAINT trade_capacities_pkey PRIMARY KEY (id);


--
-- TOC entry 4973 (class 2606 OID 16417)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4975 (class 2606 OID 16415)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5014 (class 1259 OID 16717)
-- Name: account_setup_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX account_setup_tokens_user_id_idx ON public.account_setup_tokens USING btree (user_id);


--
-- TOC entry 5001 (class 1259 OID 16618)
-- Name: activity_logs_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX activity_logs_created_at_idx ON public.activity_logs USING btree (created_at DESC);


--
-- TOC entry 4983 (class 1259 OID 16476)
-- Name: applications_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX applications_status_idx ON public.applications USING btree (status);


--
-- TOC entry 4984 (class 1259 OID 16475)
-- Name: applications_student_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX applications_student_id_idx ON public.applications USING btree (student_id);


--
-- TOC entry 4985 (class 1259 OID 16502)
-- Name: documents_application_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_application_id_idx ON public.documents USING btree (application_id);


--
-- TOC entry 4990 (class 1259 OID 16554)
-- Name: messages_conversation_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX messages_conversation_id_idx ON public.messages USING btree (conversation_id, sent_at);


--
-- TOC entry 4995 (class 1259 OID 16575)
-- Name: notifications_recipient_unread_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_recipient_unread_idx ON public.notifications USING btree (recipient_id, read_at);


--
-- TOC entry 5004 (class 1259 OID 16660)
-- Name: public_admission_requests_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX public_admission_requests_email_idx ON public.public_admission_requests USING btree (parent_email);


--
-- TOC entry 5009 (class 1259 OID 16659)
-- Name: public_admission_requests_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX public_admission_requests_status_idx ON public.public_admission_requests USING btree (status, submitted_at DESC);


--
-- TOC entry 5000 (class 1259 OID 16596)
-- Name: sessions_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_user_id_idx ON public.sessions USING btree (user_id);


--
-- TOC entry 4976 (class 1259 OID 16440)
-- Name: students_parent_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX students_parent_id_idx ON public.students USING btree (parent_id);


--
-- TOC entry 5034 (class 2606 OID 16712)
-- Name: account_setup_tokens account_setup_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_setup_tokens
    ADD CONSTRAINT account_setup_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5028 (class 2606 OID 16613)
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5023 (class 2606 OID 16522)
-- Name: announcements announcements_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 5020 (class 2606 OID 16470)
-- Name: applications applications_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5021 (class 2606 OID 16465)
-- Name: applications applications_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;


--
-- TOC entry 5022 (class 2606 OID 16497)
-- Name: documents documents_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


--
-- TOC entry 5024 (class 2606 OID 16549)
-- Name: messages messages_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 5025 (class 2606 OID 16544)
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 5026 (class 2606 OID 16570)
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5033 (class 2606 OID 16678)
-- Name: public_admission_documents public_admission_documents_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_admission_documents
    ADD CONSTRAINT public_admission_documents_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.public_admission_requests(id) ON DELETE CASCADE;


--
-- TOC entry 5029 (class 2606 OID 16697)
-- Name: public_admission_requests public_admission_requests_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_admission_requests
    ADD CONSTRAINT public_admission_requests_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE SET NULL;


--
-- TOC entry 5030 (class 2606 OID 16687)
-- Name: public_admission_requests public_admission_requests_parent_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_admission_requests
    ADD CONSTRAINT public_admission_requests_parent_user_id_fkey FOREIGN KEY (parent_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5031 (class 2606 OID 16654)
-- Name: public_admission_requests public_admission_requests_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_admission_requests
    ADD CONSTRAINT public_admission_requests_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5032 (class 2606 OID 16692)
-- Name: public_admission_requests public_admission_requests_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_admission_requests
    ADD CONSTRAINT public_admission_requests_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- TOC entry 5027 (class 2606 OID 16591)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5019 (class 2606 OID 16435)
-- Name: students students_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- TOC entry 5035 (class 2606 OID 16749)
-- Name: trade_capacities trade_capacities_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trade_capacities
    ADD CONSTRAINT trade_capacities_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


-- Completed on 2026-10-18 06:30:33

--
-- PostgreSQL database dump complete
--

\unrestrict wNJBw52VRHFZZgk2rTOZ2eZzLHXlaxLB5Hag4TkXqNVT6fd3l8V9lAwOxqulCVE

