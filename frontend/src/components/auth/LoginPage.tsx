import React, { useState, useEffect } from 'react';
import {
    Bone,
    Layers,
    FileText,
    Target,
    Mail,
    Lock,
    Eye,
    EyeOff,
    User as UserIcon,
    ArrowRight,
    Loader2,
    AlertCircle,
    ShieldCheck,
    ArrowLeft,
    RefreshCw,
    CheckCircle2,
    KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PrivacyModal } from './PrivacyModal';
import { TermsModal } from './TermsModal';

interface LoginPageProps {
    onSuccess?: () => void;
}


type AuthStep = 'auth' | '2fa' | 'forgot_request' | 'forgot_confirm';

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [step, setStep] = useState<AuthStep>('auth');
    const [otpCode, setOtpCode] = useState('');
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotCode, setForgotCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const checkPasswordRules = (pass: string) => ({
        hasMinLength: pass.length >= 8,
        hasLetter: /[a-zA-Z]/.test(pass),
        hasNumber: /[0-9]/.test(pass),
        hasSpecial: new RegExp('[!@#$%^&*(),.?":{}|<>_\\-+=~]').test(pass),
    });
    const registerRules = checkPasswordRules(password);
    const isRegisterPasswordValid = Object.values(registerRules).every(Boolean);
    const resetRules = checkPasswordRules(newPassword);
    const isResetPasswordValid = Object.values(resetRules).every(Boolean);
    const [lgpdConsent, setLgpdConsent] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
    const [isTermsOpen, setIsTermsOpen] = useState(false);

    const { login, register, verify2FA, resend2FA, requestPasswordReset, confirmPasswordReset } = useAuth();

    useEffect(() => {
        let timer: any;
        if (step === '2fa' && resendTimer > 0) {
            timer = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else if (resendTimer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(timer);
    }, [step, resendTimer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setInfoMessage(null);

        if (isRegister && !lgpdConsent) {
            setError('É obrigatório concordar com os Termos de Uso e Politica de Privacidade para criar sua conta.');
            return;
        }

        if (isRegister && !isRegisterPasswordValid) {
            setError('A senha deve cumprir todos os 4 requisitos de segurança.');
            return;
        }

        setLoading(true);
        try {
            if (isRegister) {
                const res = await register(name.trim(), email.trim(), password, lgpdConsent);
                if (res.requires2FA) {
                    setStep('2fa');
                    setResendTimer(60);
                    setCanResend(false);
                    setInfoMessage(res.message || 'Código enviado para o seu e-mail!');
                }
            } else {
                const res = await login(email.trim(), password);
                if (res.requires2FA) {
                    setStep('2fa');
                    setResendTimer(60);
                    setCanResend(false);
                    setInfoMessage(res.message || 'Código de verificação enviado!');
                }
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || err.response?.data?.detail || err.response?.data?.email?.[0] || 'Falha na autenticação. Verifique seus dados.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (otpCode.trim().length !== 6) {
            setError('O código de verificação deve ter exatamente 6 dígitos numéricos.');
            return;
        }

        setLoading(true);
        try {
            await verify2FA(email.trim(), otpCode.trim());
            if (onSuccess) onSuccess();
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Código incorreto ou expirado. Tente novamente.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!canResend) return;
        setError(null);
        setLoading(true);
        try {
            await resend2FA(email.trim());
            setResendTimer(60);
            setCanResend(false);
            setInfoMessage('Um novo código de 6 dígitos foi enviado!');
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Não foi possível reenviar o código agora.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = 'http://127.0.0.1:8000/api/auth/social/google/login/';
    };
    const handleRequestPasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setInfoMessage(null);

        if (!forgotEmail.trim()) {
            setError('Por favor, informe seu e-mail cadastrado.');
            return;
        }

        setLoading(true);
        try {
            const msg = await requestPasswordReset(forgotEmail.trim());
            setInfoMessage(msg);
            setStep('forgot_confirm');
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Não foi possível enviar o código agora. Tente mais tarde.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (forgotCode.trim().length !== 6) {
            setError('O código de recuperação deve ter 6 dígitos.');
            return;
        }

        if (!isResetPasswordValid) {
            setError('A nova senha deve conter no mínimo 8 caracteres, 1 letra, 1 número e 1 caractere especial.');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setError('As duas senhas digitadas não coincidem.');
            return;
        }

        setLoading(true);
        try {
            const msg = await confirmPasswordReset(forgotEmail.trim(), forgotCode.trim(), newPassword);
            setInfoMessage(msg);
            setStep('auth');
            setIsRegister(false);
            setPassword('');
            setForgotCode('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Código incorreto ou expirado. Tente novamente.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="min-h-screen w-full bg-slate-50 flex flex-col lg:flex-row relative overflow-hidden font-sans">

                {/* COLUNA ESQUERDA: APRESENTAÇÃO */}
                <div className="w-full lg:w-[48%] xl:w-[45%] bg-gradient-to-br from-[#1E331C] via-[#2E482C] to-[#121E11] text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden flex-shrink-0">

                    {/* Logo Superior */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-md shadow-inner">
                            <Bone className="w-5 h-5 text-[#E7DFC6]" />
                        </div>
                        <span className="font-serif font-bold text-2xl tracking-tight text-stone-200">OsteoLearn</span>
                    </div>

                    {/* Título Central */}
                    <div className="my-10 space-y-3">
                        <span className="text-[11px] font-bold tracking-widest text-[#E7DFC6]/80 uppercase">Plataforma de Osteologia 3D</span>
                        <h1 className="font-serif font-bold text-4xl lg:text-5xl text-white leading-tight">OsteoLearn</h1>
                        <p className="text-base text-white/80 max-w-md font-light leading-relaxed">
                            Domine a osteologia humana de forma interativa e prática.
                        </p>
                    </div>

                    {/* Card com os Recursos (Glassmorphism) */}
                    <div className="p-6 bg-white/10 rounded-3xl border border-white/15 backdrop-blur-md space-y-5 shadow-2xl">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                                <Layers className="w-5 h-5 text-[#E7DFC6]" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-semibold text-stone-200">Atlas 3D Interativo</h3>
                                <p className="text-xs text-stone-300/80 leading-relaxed font-light">
                                    Explore modelos anatômicos de alta definição com mapeamento ósseo detalhado e texturas realistas.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                                <FileText className="w-5 h-5 text-[#E7DFC6]" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-semibold text-stone-200">Guia Clínico Completo</h3>
                                <p className="text-xs text-stone-300/80 leading-relaxed font-light">
                                    Acesse correlações clínicas, acidentes anatômicos e patologias.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                                <Target className="w-5 h-5 text-[#E7DFC6]" />
                            </div>
                            <div className="space-y-0.5">
                                <h3 className="text-sm font-semibold text-stone-200">Quiz Alfinetada</h3>
                                <p className="text-xs text-stone-300/80 leading-relaxed font-light">
                                    Teste seus conhecimentos simulando o clássico exame de alfinetadas em tempo real com cronômetro.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block pt-6"></div>
                </div>

                {/* COLUNA DIREITA: FORMULÁRIOS DINÂMICOS */}
                <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 overflow-y-auto">
                    <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-[0px_16px_40px_0px_rgba(22,34,15,0.06)] border border-slate-100 p-8 sm:p-10 space-y-6">

                        {/* 1: login ou cadastro */}
                        {step === 'auth' && (
                            <>
                                <div className="text-center space-y-2">
                                    <div className="inline-flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-lg bg-[#2E482C] flex items-center justify-center text-white">
                                            <Bone className="w-4 h-4 text-[#E7DFC6]" />
                                        </div>
                                        <span className="font-serif font-bold text-lg text-[#2E482C]">OsteoLearn</span>
                                    </div>
                                    <h2 className="font-serif font-bold text-2xl sm:text-3xl text-slate-800">
                                        {isRegister ? 'Criar sua Conta' : 'Bem-vindo de volta'}
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 font-normal">
                                        {isRegister ? 'Cadastre-se para acessar o Atlas 3D.' : 'Acesse sua conta para continuar seus estudos.'}
                                    </p>
                                </div>

                                {/* Botão do Google */}
                                <button
                                    type="button"
                                    onClick={handleGoogleLogin}
                                    className="w-full h-11 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-3 transition-all shadow-sm cursor-pointer hover:border-slate-300"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                    </svg>
                                    <span>Continuar com o Google</span>
                                </button>

                                {/* Divisor */}
                                <div className="relative flex items-center justify-center my-3">
                                    <div className="border-t border-slate-200 w-full"></div>
                                    <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider absolute">
                                        ou continue com e-mail
                                    </span>
                                </div>

                                {infoMessage && (
                                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                        <span>{infoMessage}</span>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {isRegister && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-700">Nome Completo</label>
                                            <div className="h-11 px-3.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5 focus-within:border-[#2E482C] focus-within:ring-2 focus-within:ring-[#2E482C]/10 transition-all">
                                                <UserIcon className="w-4 h-4 text-slate-400" />
                                                <input
                                                    type="text"
                                                    required
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="Seu nome completo"
                                                    className="w-full text-xs text-slate-800 outline-none bg-transparent placeholder-slate-400"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">E-mail</label>
                                        <div className="h-11 px-3.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5 focus-within:border-[#2E482C] focus-within:ring-2 focus-within:ring-[#2E482C]/10 transition-all">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="seu.email@exemplo.com"
                                                className="w-full text-xs text-slate-800 outline-none bg-transparent placeholder-slate-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-medium text-slate-700">Senha</label>
                                            {!isRegister && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setStep('forgot_request'); setError(null); setInfoMessage(null); setForgotEmail(email); }}
                                                    className="text-xs font-semibold text-[#2E482C] hover:underline cursor-pointer"
                                                >
                                                    Esqueceu a senha?
                                                </button>
                                            )}
                                        </div>
                                        <div className="h-11 px-3.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5 focus-within:border-[#2E482C] focus-within:ring-2 focus-within:ring-[#2E482C]/10 transition-all">
                                            <Lock className="w-4 h-4 text-slate-400" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                minLength={8}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Sua senha secreta"
                                                className="w-full text-xs text-slate-800 outline-none bg-transparent placeholder-slate-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                            >
                                                {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    {/* Indicador visual de regras de senha no Cadastro */}
                                    {isRegister && (
                                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px] animate-in fade-in">
                                            <p className="font-semibold text-slate-600 mb-1">A senha deve conter:</p>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <span className={`flex items-center gap-1.5 ${registerRules.hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                                                    {registerRules.hasMinLength ? '✓' : '○'} Mínimo 8 dígitos
                                                </span>
                                                <span className={`flex items-center gap-1.5 ${registerRules.hasLetter ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                                                    {registerRules.hasLetter ? '✓' : '○'} Pelo menos 1 letra
                                                </span>
                                                <span className={`flex items-center gap-1.5 ${registerRules.hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                                                    {registerRules.hasNumber ? '✓' : '○'} Pelo menos 1 número
                                                </span>
                                                <span className={`flex items-center gap-1.5 ${registerRules.hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                                                    {registerRules.hasSpecial ? '✓' : '○'} 1 caractere especial
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {isRegister && (
                                        <div className="pt-2">
                                            <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={lgpdConsent}
                                                    onChange={(e) => setLgpdConsent(e.target.checked)}
                                                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#2E482C] focus:ring-[#2E482C]"
                                                />
                                                <span className="text-[11px] text-slate-600 leading-tight">
                                                    Concordo com os{' '}
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsTermsOpen(true)}
                                                        className="text-[#2E482C] font-semibold underline hover:text-emerald-700 cursor-pointer"
                                                    >
                                                        Termos de Uso
                                                    </button>
                                                    {' '}e com a{' '}
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsPrivacyOpen(true)}
                                                        className="text-[#2E482C] font-semibold underline hover:text-emerald-700 cursor-pointer"
                                                    >
                                                        Política de Privacidade
                                                    </button>
                                                    .
                                                </span>
                                            </label>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-12 bg-[#2E482C] hover:bg-[#1E331C] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 mt-4 cursor-pointer"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <span>{isRegister ? 'Continuar' : 'Entrar'}</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
                                    {isRegister ? (
                                        <p>
                                            Já tem uma conta?{' '}
                                            <button
                                                onClick={() => { setIsRegister(false); setError(null); }}
                                                className="text-[#2E482C] font-bold hover:underline cursor-pointer"
                                            >
                                                Fazer Login
                                            </button>
                                        </p>
                                    ) : (
                                        <p>
                                            Não tem uma conta?{' '}
                                            <button
                                                onClick={() => { setIsRegister(true); setError(null); }}
                                                className="text-[#2E482C] font-bold hover:underline cursor-pointer"
                                            >
                                                Criar conta gratuita
                                            </button>
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* 2: autenticacao de dois fatores (2fa) */}
                        {step === '2fa' && (
                            <>
                                <div className="text-center space-y-2">
                                    <div className="w-12 h-12 rounded-2xl bg-[#2E482C]/10 text-[#2E482C] flex items-center justify-center mx-auto mb-2">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <h2 className="font-serif font-bold text-2xl sm:text-3xl text-slate-800">
                                        Verificação em 2 Etapas
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 font-normal">
                                        Enviamos um código de segurança de 6 dígitos para o seu e-mail (Se você não encontrar nosso e-mail na Caixa de Entrada, verifique a sua pasta de Spam ou Lixo Eletrônico.):
                                    </p>
                                    <p className="text-xs font-bold text-[#2E482C] bg-[#2E482C]/5 py-1 px-3 rounded-full inline-block">
                                        {email}
                                    </p>
                                </div>

                                {infoMessage && (
                                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                        <span>{infoMessage}</span>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleVerify2FA} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-700 block text-center">
                                            Digite o código de 6 dígitos
                                        </label>
                                        <div className="flex justify-center">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={6}
                                                autoFocus
                                                required
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                                placeholder="000000"
                                                className="w-56 h-14 text-center tracking-[0.5em] font-mono font-bold text-2xl text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-[#2E482C] focus:bg-white focus:outline-none transition-all"
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-400 text-center">
                                            O código expira em 5 minutos
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || otpCode.length !== 6}
                                        className="w-full h-12 bg-[#2E482C] hover:bg-[#1E331C] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <span>Verificar e Acessar</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="space-y-3 pt-2 text-center text-xs">
                                    <div>
                                        {canResend ? (
                                            <button
                                                type="button"
                                                onClick={handleResendCode}
                                                disabled={loading}
                                                className="inline-flex items-center gap-1.5 text-[#2E482C] font-semibold hover:underline cursor-pointer"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                                <span>Reenviar código para meu e-mail</span>
                                            </button>
                                        ) : (
                                            <span className="text-slate-400">
                                                Reenviar novo código em <strong className="text-slate-600 font-mono">{resendTimer}s</strong>
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => { setStep('auth'); setError(null); setOtpCode(''); }}
                                            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                                        >
                                            <ArrowLeft className="w-3.5 h-3.5" />
                                            <span>Voltar e trocar de e-mail</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* 3: solicitar recuperacao de senha */}
                        {step === 'forgot_request' && (
                            <>
                                <div className="text-center space-y-2">
                                    <div className="w-12 h-12 rounded-2xl bg-[#2E482C]/10 text-[#2E482C] flex items-center justify-center mx-auto mb-2">
                                        <KeyRound className="w-6 h-6" />
                                    </div>
                                    <h2 className="font-serif font-bold text-2xl sm:text-3xl text-slate-800">
                                        Recuperar Senha
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 font-normal">
                                        Digite seu e-mail para receber um código de 6 dígitos para criar uma nova senha.
                                    </p>
                                </div>

                                {error && (
                                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Seu E-mail Cadastrado</label>
                                        <div className="h-11 px-3.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5 focus-within:border-[#2E482C] focus-within:ring-2 focus-within:ring-[#2E482C]/10 transition-all">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            <input
                                                type="email"
                                                required
                                                value={forgotEmail}
                                                onChange={(e) => setForgotEmail(e.target.value)}
                                                placeholder="seu.email@exemplo.com"
                                                className="w-full text-xs text-slate-800 outline-none bg-transparent placeholder-slate-400"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-12 bg-[#2E482C] hover:bg-[#1E331C] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 mt-4 cursor-pointer"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <span>Enviar Código de Recuperação</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="pt-2 text-center text-xs">
                                    <button
                                        type="button"
                                        onClick={() => { setStep('auth'); setError(null); setInfoMessage(null); }}
                                        className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        <span>Lembrou a senha? Voltar para o login</span>
                                    </button>
                                </div>
                            </>
                        )}

                        {/* 4: digitar codigo e criar nova senha */}
                        {step === 'forgot_confirm' && (
                            <>
                                <div className="text-center space-y-2">
                                    <div className="w-12 h-12 rounded-2xl bg-[#2E482C]/10 text-[#2E482C] flex items-center justify-center mx-auto mb-2">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <h2 className="font-serif font-bold text-2xl sm:text-3xl text-slate-800">
                                        Criar Nova Senha
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 font-normal">
                                        Enviamos o código de 6 dígitos para o seu e-mail:
                                    </p>
                                    <p className="text-xs font-bold text-[#2E482C] bg-[#2E482C]/5 py-1 px-3 rounded-full inline-block">
                                        {forgotEmail}
                                    </p>
                                </div>

                                {infoMessage && (
                                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                        <span>{infoMessage}</span>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700 text-center block">
                                            Código de Recuperação (6 dígitos)
                                        </label>
                                        <div className="flex justify-center">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                autoFocus
                                                required
                                                value={forgotCode}
                                                onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                                                placeholder="000000"
                                                className="w-48 h-12 text-center tracking-[0.4em] font-mono font-bold text-xl text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#2E482C] focus:bg-white focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Nova Senha</label>
                                        <div className="h-11 px-3.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5 focus-within:border-[#2E482C] focus-within:ring-2 focus-within:ring-[#2E482C]/10 transition-all">
                                            <Lock className="w-4 h-4 text-slate-400" />
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                required
                                                minLength={8}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Mínimo de 8 caracteres"
                                                className="w-full text-xs text-slate-800 outline-none bg-transparent placeholder-slate-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                                            >
                                                {showNewPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Indicador visual de regras na Nova Senha */}
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px] animate-in fade-in">
                                        <p className="font-semibold text-slate-600 mb-1">A nova senha deve conter:</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <span className={`flex items-center gap-1.5 ${resetRules.hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                                                {resetRules.hasMinLength ? '✓' : '○'} Mínimo 8 dígitos
                                            </span>
                                            <span className={`flex items-center gap-1.5 ${resetRules.hasLetter ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                                                {resetRules.hasLetter ? '✓' : '○'} Pelo menos 1 letra
                                            </span>
                                            <span className={`flex items-center gap-1.5 ${resetRules.hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                                                {resetRules.hasNumber ? '✓' : '○'} Pelo menos 1 número
                                            </span>
                                            <span className={`flex items-center gap-1.5 ${resetRules.hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                                                {resetRules.hasSpecial ? '✓' : '○'} 1 caractere especial
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-700">Confirmar Nova Senha</label>
                                        <div className="h-11 px-3.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5 focus-within:border-[#2E482C] focus-within:ring-2 focus-within:ring-[#2E482C]/10 transition-all">
                                            <Lock className="w-4 h-4 text-slate-400" />
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                required
                                                minLength={8}
                                                value={confirmNewPassword}
                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                placeholder="Repita a nova senha"
                                                className="w-full text-xs text-slate-800 outline-none bg-transparent placeholder-slate-400"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || forgotCode.length !== 6}
                                        className="w-full h-12 bg-[#2E482C] hover:bg-[#1E331C] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 mt-4 cursor-pointer"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <span>Salvar Nova Senha</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="pt-2 text-center text-xs">
                                    <button
                                        type="button"
                                        onClick={() => { setStep('forgot_request'); setError(null); }}
                                        className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        <span>Reenviar código para outro e-mail</span>
                                    </button>
                                </div>
                            </>
                        )}

                    </div>

                    {/* Rodapé com Direitos e Links da LGPD */}
                    <div className="mt-8 text-center space-y-1.5 text-xs text-slate-400">
                        <p>© 2026 OsteoLearn 3D. Todos os direitos reservados.</p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsTermsOpen(true)}
                                className="hover:text-slate-600 hover:underline transition-colors cursor-pointer"
                            >
                                Termos de Uso
                            </button>
                            <span>·</span>
                            <button
                                type="button"
                                onClick={() => setIsPrivacyOpen(true)}
                                className="hover:text-slate-600 hover:underline transition-colors cursor-pointer"
                            >
                                Política de Privacidade
                            </button>
                        </div>
                    </div>

                </div>

            </div>

            {/* Modal Interativo de Leitura da LGPD */}
            <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
            <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
        </>
    );
};