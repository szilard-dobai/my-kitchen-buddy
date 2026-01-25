import { ArrowRight, CheckCircle, ChefHat, Clock, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'

const features = [
    {
        icon: Sparkles,
        title: 'AI-Powered Extraction',
        description:
            'Advanced AI analyzes spoken instructions from cooking videos to create structured recipes.',
    },
    {
        icon: Clock,
        title: 'Instant Results',
        description:
            'Get a complete recipe with ingredients, steps, and nutrition info in seconds.',
    },
    {
        icon: CheckCircle,
        title: 'Organized & Searchable',
        description:
            'Build your personal recipe library with easy filtering and search.',
    },
]

const platforms = [
    { name: 'TikTok', color: 'bg-tiktok', icon: '♪' },
    { name: 'Instagram Reels', color: 'bg-instagram', icon: '◎' },
    { name: 'YouTube Shorts', color: 'bg-youtube', icon: '▶' },
]

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="container mx-auto px-4 flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                            <ChefHat className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-lg hidden sm:inline-block">
                            My Kitchen Buddy
                        </span>
                    </Link>
                    <div className="flex gap-3">
                        <Link href="/login">
                            <Button variant="ghost" size="sm">
                                Sign in
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button size="sm">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <section className="relative overflow-hidden hero-gradient">
                    <div className="absolute inset-0 z-0">
                        <Image
                            src="/hero-kitchen.jpg"
                            alt="Fresh ingredients"
                            width={1920}
                            height={1080}
                            className="object-cover"
                        />
                        <div className="absolute inset-0 hero-gradient" />
                    </div>
                    <div className="container mx-auto px-4 relative z-10 py-24 md:py-32">
                        <div className="max-w-2xl">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-fade-in">
                                Turn Cooking Videos Into Recipes
                                <span className="block text-primary-foreground/90">
                                    Instantly
                                </span>
                            </h1>
                            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 animate-fade-in animation-delay-100">
                                Paste a TikTok, Instagram Reel, or YouTube video
                                link and let AI extract a complete, structured
                                recipe for you.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in animation-delay-200">
                                <Link href="/extract">
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto gap-2 bg-card text-foreground hover:bg-card/90"
                                    >
                                        Extract a Recipe
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button
                                        size="lg"
                                        variant="secondary"
                                        className="w-full sm:w-auto"
                                    >
                                        Create Free Account
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-16 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <h2 className="text-center text-xl font-medium text-muted-foreground mb-8">
                            Works with your favorite platforms
                        </h2>
                        <div className="flex flex-wrap justify-center gap-4">
                            {platforms.map((platform) => (
                                <div
                                    key={platform.name}
                                    className={`flex items-center gap-2 ${platform.color} text-primary-foreground px-6 py-3 rounded-full font-medium`}
                                >
                                    <span className="text-lg">
                                        {platform.icon}
                                    </span>
                                    {platform.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                How It Works
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                From video to recipe in three simple steps
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {features.map((feature, index) => {
                                const Icon = feature.icon
                                return (
                                    <div
                                        key={feature.title}
                                        className="text-center p-6 rounded-xl bg-card card-shadow hover:shadow-lg transition-shadow animate-fade-in"
                                        style={{
                                            animationDelay: `${index * 100}ms`,
                                        }}
                                    >
                                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                                            <Icon className="h-7 w-7" />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {feature.description}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                <section className="py-20 bg-primary/5">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Build Your Recipe Collection?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                            Join thousands of home cooks who save and organize
                            their favorite video recipes.
                        </p>
                        <Link href="/register">
                            <Button size="lg" className="gap-2">
                                Get Started Free
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    )
}
