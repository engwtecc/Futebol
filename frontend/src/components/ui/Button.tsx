import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
}

export default function Button({
    loading,
    children,
    className = "",
    ...rest
}: Props) {
    return (
        <button
            {...rest}
            disabled={loading || rest.disabled}
            className={`bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-5 py-2 rounded-lg transition ${className}`}
        >
            {loading ? "Carregando..." : children}
        </button>
    );
}