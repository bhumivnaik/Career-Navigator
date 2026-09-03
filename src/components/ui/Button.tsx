import type { ReactNode } from "react";

export interface ButtonProps {
    children: ReactNode;
    type?: "button" | "submit";
    variant?: "primary" | "secondary" | "danger";
    disabled?: boolean;
    id?: string;
    onClick?: () => void;
    className?: string;
}

export default function Button({ children, type, variant, disabled, id, onClick }: ButtonProps) {
    return (
        <button id={id} type={type} className={`btn ${variant}`} disabled={disabled} onClick={onClick}>
            {children}
        </button>
    );
}