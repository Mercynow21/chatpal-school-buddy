-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT,
  phone_number TEXT,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  preferred_language TEXT DEFAULT 'english' CHECK (preferred_language IN ('english', 'amharic')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscribers table for subscription management
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT DEFAULT 'trial',
  subscription_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create Bible verses table with bilingual content
CREATE TABLE public.bible_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verse_reference TEXT NOT NULL,
  english_text TEXT NOT NULL,
  amharic_text TEXT NOT NULL,
  english_devotion TEXT,
  amharic_devotion TEXT,
  theme TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create verification codes table for phone/email verification
CREATE TABLE public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'phone')),
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create policies for subscribers  
CREATE POLICY "Users can view their own subscription" ON public.subscribers
  FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Edge functions can manage subscriptions" ON public.subscribers
  FOR ALL USING (true);

-- Create policies for Bible verses (public read)
CREATE POLICY "Anyone can view Bible verses" ON public.bible_verses
  FOR SELECT USING (true);

-- Create policies for verification codes
CREATE POLICY "Users can view their own verification codes" ON public.verification_codes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own verification codes" ON public.verification_codes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Edge functions can manage verification codes" ON public.verification_codes
  FOR ALL USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, phone_number)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'username',
    NEW.raw_user_meta_data ->> 'phone_number'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample Bible verses
INSERT INTO public.bible_verses (verse_reference, english_text, amharic_text, english_devotion, amharic_devotion, theme) VALUES
('John 3:16', 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.', 'እግዚአብሔር ዓለምን በጣም ስለወደዱ አንድና ብቸኛ ወልዳቸውን ሰጡ፤ በእርሱም የሚያምን ሁሉ እንዳይጠፋ ነገር ግን የዘላለም ሕይወት እንዲኖረው።', 'God''s love for us is immeasurable. He gave His most precious gift - His Son - so that we might have eternal life. This verse reminds us that we are deeply loved and valued by our Creator.', 'የእግዚአብሔር ፍቅር ለእኛ ሊለካ የማይችል ነው። እኛ የዘላለም ሕይወት እንድንወርስ በጣም ውድ የሆነውን ስጦታውን - ወልዱን - ሰጠን። ይህ ጥቅስ በፈጣሪችን በጣም እንደምንወደድና እንደምንከበር ያስታውሰናል።', 'love'),
('Philippians 4:13', 'I can do all this through him who gives me strength.', 'እኔ በሚያጠንክረኝ በክርስቶስ ሁሉን እችላለሁ።', 'With Christ''s strength, no challenge is too great. When we feel weak or overwhelmed, we can draw upon His infinite power and find the courage to persevere.', 'በክርስቶስ ኃይል ምንም ፈተና ከእኛ የላቀ አይደለም። ደካማ ወይም የተቸገርን በምንሰምዓበት ጊዜ፣ ከእርሱ ማለቂያ ባለው ኃይል መሳብ እና መጽናት የምንችልበትን ድፍረት ማግኘት እንችላለን።', 'strength'),
('Jeremiah 29:11', 'For I know the plans I have for you," declares the Lord, "plans to prosper you and not to harm you, to give you hope and a future.', 'እኔ ለእናንተ ያሰብኩት አሳብ አውቃለሁ ይላል እግዚአብሔር፤ ልታገሡት የሚያደርግ አሳብ እንጂ ላያመጣ የሚያደርግ አሳብ አይደለም፤ ተስፋና መጨረሻ ልሰጣችሁ የሚያደርግ አሳብ ነው።', 'God has wonderful plans for your life! Even when circumstances seem difficult, remember that He is working all things together for your good. Trust in His perfect timing and divine purpose.', 'እግዚአብሔር ለሕይወታችሁ ድንቅ ዕቅዶች አሉት! ሁኔታዎች አስቸጋሪ ሲመስሉ እንኳን፣ ሁሉንም ነገር ለበጎችህ እየሰራ እንደሆነ አስታውስ። በእርሱ ፍጹም ጊዜና መለኮታዊ ዓላማ ታመን።', 'hope');