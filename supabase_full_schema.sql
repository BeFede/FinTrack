-- FinTrack Pro - Complete Supabase Schema
-- Run this in your Supabase SQL Editor to create all necessary tables

-- 1. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 2. Credit Cards Table
CREATE TABLE IF NOT EXISTS public.credit_cards (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 3. Recurring Items Table
CREATE TABLE IF NOT EXISTS public.recurring (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 4. Assets Table
CREATE TABLE IF NOT EXISTS public.assets (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 5. Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 6. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);

-- 7. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  data JSONB NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Credit Cards
CREATE POLICY "Users can view their own credit_cards" ON public.credit_cards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own credit_cards" ON public.credit_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own credit_cards" ON public.credit_cards
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own credit_cards" ON public.credit_cards
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Recurring
CREATE POLICY "Users can view their own recurring" ON public.recurring
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recurring" ON public.recurring
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recurring" ON public.recurring
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recurring" ON public.recurring
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Assets
CREATE POLICY "Users can view their own assets" ON public.assets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assets" ON public.assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assets" ON public.assets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assets" ON public.assets
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Budgets
CREATE POLICY "Users can view their own budgets" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own budgets" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own budgets" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own budgets" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Categories
CREATE POLICY "Users can view their own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Settings
CREATE POLICY "Users can view their own settings" ON public.settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON public.settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_updated_at ON public.transactions(updated_at);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON public.credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_updated_at ON public.credit_cards(updated_at);
CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON public.recurring(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_updated_at ON public.recurring(updated_at);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_updated_at ON public.assets(updated_at);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_updated_at ON public.budgets(updated_at);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_updated_at ON public.categories(updated_at);
CREATE INDEX IF NOT EXISTS idx_settings_user_id ON public.settings(user_id);
CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON public.settings(updated_at);
