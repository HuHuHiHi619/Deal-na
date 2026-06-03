-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid,
  title text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT options_pkey PRIMARY KEY (id),
  CONSTRAINT options_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.room(id),
  CONSTRAINT options_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.room (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_code character varying NOT NULL UNIQUE,
  title text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  expired_at timestamp with time zone,
  created_by uuid,
  started_at timestamp without time zone,
  CONSTRAINT room_pkey PRIMARY KEY (id),
  CONSTRAINT room_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.room_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid,
  user_id uuid,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT room_members_pkey PRIMARY KEY (id),
  CONSTRAINT room_members_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.room(id),
  CONSTRAINT room_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.votes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid,
  option_id uuid,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT votes_pkey PRIMARY KEY (id),
  CONSTRAINT votes_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.room(id),
  CONSTRAINT votes_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.options(id),
  CONSTRAINT votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);