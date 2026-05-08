import type * as React from 'react';

export interface NavbarProps {
	isAuthenticated?: boolean;
	onLogout?: () => void;
}

export declare const Navbar: React.FC<NavbarProps>;
