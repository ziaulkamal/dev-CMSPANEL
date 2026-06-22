import {
    Users, Kanban, Mail, MessageSquare, LayoutDashboard, Settings,
    FileText, BookOpen,
    TableIcon, CalendarIcon, UploadIcon, WandIcon,
    SmileIcon, LayoutGridIcon, UserPlusIcon, LogInIcon, KeyRoundIcon,
    AlertOctagonIcon, ServerCrashIcon,
} from '@lucide/vue';

export interface NavItem {
    label:      string;
    icon?:      unknown;
    href?:      string;
    badge?:     string | number;
    badgeColor?: string;
    subtitle?:  string;
    active?:    boolean;
    children?:  NavItem[];
}

export interface NavGroup {
    label?:    string;
    subtitle?: string;
    color?:    string;
    items:     NavItem[];
}

export const navGroups: NavGroup[] = [
    {
        label: '',
        items: [
            { label: 'Dashboard', icon: LayoutDashboard, href: '/', active: false },
        ],
    },
    {
        label:    'Applications',
        subtitle: 'Custom made application designs',
        color:    '#6366f1',
        items: [
            { label: 'Contacts',   icon: Users,         href: '/contacts', active: false },
            { label: 'Kanban',     icon: Kanban,        href: '/kanban',   active: false },
            { label: 'Mail',       icon: Mail,          href: '/mail',     active: false, badge: '3', badgeColor: '#ef4444' },
            { label: 'Chat',       icon: MessageSquare, href: '/chat',     active: false, subtitle: '3 unread messages' },
            {
                label: 'Pages',
                icon:  FileText,
                children: [
                    {
                        label: 'Blog',
                        icon:  BookOpen,
                        children: [
                            { label: 'All Posts', href: '/blog',        active: false },
                            { label: 'Create',    href: '/blog/create', active: false },
                        ],
                    },
                    { label: 'Landing', icon: FileText, href: '/landing', active: false },
                ],
            },
        ],
    },
    {
        label: 'Components',
        color: '#8b5cf6',
        items: [
            { label: 'Data Table',   icon: TableIcon,    href: '/demo/datatable',  active: false },
            { label: 'Date Picker',  icon: CalendarIcon, href: '/demo/datepicker', active: false },
            { label: 'File Upload',  icon: UploadIcon,   href: '/demo/dropzone',   active: false },
            { label: 'Wizard Form',  icon: WandIcon,     href: '/demo/wizard',     active: false },
            { label: 'Icon Gallery', icon: SmileIcon,    href: '/icons',           active: false },
            { label: 'Block Sections',icon: LayoutGridIcon, href: '/blocks',       active: false },
        ],
    },
    {
        label: 'Pages',
        color: '#10b981',
        items: [
            {
                label: 'Contacts',
                icon: Users,
                children: [
                    { label: 'All Contacts',    icon: Users,        href: '/contacts',    active: false },
                    { label: 'Add Contact',     icon: UserPlusIcon, href: '/contacts/new',active: false },
                    { label: 'Contact Detail',  icon: Users,        href: '/contacts/1',  active: false },
                ],
            },
            {
                label: 'Auth',
                icon: LogInIcon,
                children: [
                    { label: 'Login',           icon: LogInIcon,    href: '/login',           active: false },
                    { label: 'Register',        icon: UserPlusIcon, href: '/register',        active: false },
                    { label: 'Forgot Password', icon: KeyRoundIcon, href: '/forgot-password', active: false },
                ],
            },
            {
                label: 'Errors',
                icon: AlertOctagonIcon,
                children: [
                    { label: '404 Not Found',   icon: AlertOctagonIcon, href: '/404', active: false },
                    { label: '500 Server Error',icon: ServerCrashIcon,  href: '/500', active: false },
                ],
            },
        ],
    },
    {
        label: 'System',
        color: '#64748b',
        items: [
            { label: 'Settings',    icon: Settings,        href: '/settings', active: false },
            { label: 'UI Showcase', icon: LayoutDashboard, href: '/ui',       active: false, badge: 'DEV', badgeColor: '#8b5cf6' },
        ],
    },
];
