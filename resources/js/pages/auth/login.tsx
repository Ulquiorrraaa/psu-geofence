import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <>
            <Head title="Log in" />

            {/* TITLE */}
            <div className="mb-8 text-center">
                <h1 className="text-4xl leading-tight font-extrabold text-[#710006] sm:text-5xl">
                    GPS
                    <br />
                    Attendance
                </h1>

                <p className="mt-3 text-base text-gray-500">
                    Login to your account
                </p>
            </div>

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            {/* EMAIL */}
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="email"
                                    className="text-base font-semibold text-[#710006]"
                                >
                                    Email Address
                                </Label>

                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    className="h-14 rounded-2xl border-gray-300 text-black placeholder:text-gray-400"
                                />

                                <InputError message={errors.email} />
                            </div>

                            {/* PASSWORD */}
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label
                                        htmlFor="password"
                                        className="text-base font-semibold text-[#710006]"
                                    >
                                        Password
                                    </Label>

                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm font-semibold text-[#710006]"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>

                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    className="h-14 rounded-2xl border-gray-300 text-black placeholder:text-gray-400"
                                />

                                <InputError message={errors.password} />
                            </div>

                            {/* REMEMBER */}
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />

                                <Label
                                    htmlFor="remember"
                                    className="text-gray-700"
                                >
                                    Remember me
                                </Label>
                            </div>

                            {/* BUTTON */}
                            <Button
                                type="submit"
                                className="mt-4 h-14 w-full rounded-2xl bg-[#8b0008] text-base font-semibold text-white hover:bg-[#6f0006]"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log In
                            </Button>
                        </div>

                        {/* REGISTER */}
                        {canRegister && (
                            <div className="text-center text-sm text-gray-600">
                                Don't have an account?{' '}
                                <TextLink
                                    href={register()}
                                    tabIndex={5}
                                    className="font-semibold text-[#710006]"
                                >
                                    Sign up
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {/* STATUS */}
            {status && (
                <div className="mt-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: '',
    description: '',
};
