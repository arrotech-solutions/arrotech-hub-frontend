/**
 * Organization API service for Arrotech Hub.
 * Handles all API calls to /api/v1/organizations endpoints.
 */
import apiService from './api';
import {
    CreateOrganizationRequest,
    Organization,
    OrganizationMember,
    OrganizationInvitation,
    Department,
    AuditLogEntry,
    OrgRole,
} from '../types';

const BASE = '/api/v1/organizations';

const organizationService = {
    // ── Organization CRUD ──────────────────────────────────────────────

    async create(data: CreateOrganizationRequest) {
        const res = await apiService.request({ method: 'POST', url: BASE, data });
        return res.data;
    },

    async list() {
        const res = await apiService.request({ method: 'GET', url: BASE });
        return res.data;
    },

    async get(orgId: number) {
        const res = await apiService.request({ method: 'GET', url: `${BASE}/${orgId}` });
        return res.data;
    },

    async update(orgId: number, data: Partial<CreateOrganizationRequest>) {
        const res = await apiService.request({ method: 'PUT', url: `${BASE}/${orgId}`, data });
        return res.data;
    },

    async remove(orgId: number) {
        const res = await apiService.request({ method: 'DELETE', url: `${BASE}/${orgId}` });
        return res.data;
    },

    // ── Members ────────────────────────────────────────────────────────

    async listMembers(orgId: number) {
        const res = await apiService.request({ method: 'GET', url: `${BASE}/${orgId}/members` });
        return res.data;
    },

    async addMember(orgId: number, userId: number, role: OrgRole = 'member', title?: string) {
        const res = await apiService.request({
            method: 'POST', url: `${BASE}/${orgId}/members`,
            data: { user_id: userId, role, title },
        });
        return res.data;
    },

    async updateMemberRole(orgId: number, userId: number, role: OrgRole, departmentId?: number | null) {
        const data: any = { role };
        if (departmentId !== undefined) data.department_id = departmentId;
        const res = await apiService.request({
            method: 'PUT', url: `${BASE}/${orgId}/members/${userId}`,
            data,
        });
        return res.data;
    },

    async assignMemberDepartment(orgId: number, userId: number, departmentId: number | null) {
        const res = await apiService.request({
            method: 'PUT', url: `${BASE}/${orgId}/members/${userId}`,
            data: { department_id: departmentId === null ? 0 : departmentId },
        });
        return res.data;
    },

    async removeMember(orgId: number, userId: number) {
        const res = await apiService.request({
            method: 'DELETE', url: `${BASE}/${orgId}/members/${userId}`,
        });
        return res.data;
    },

    // ── Invitations ────────────────────────────────────────────────────

    async createInvitation(orgId: number, email: string, role: OrgRole = 'member') {
        const res = await apiService.request({
            method: 'POST', url: `${BASE}/${orgId}/invitations`,
            data: { email, role },
        });
        return res.data;
    },

    async listInvitations(orgId: number) {
        const res = await apiService.request({ method: 'GET', url: `${BASE}/${orgId}/invitations` });
        return res.data;
    },

    async revokeInvitation(orgId: number, invitationId: number) {
        const res = await apiService.request({
            method: 'DELETE', url: `${BASE}/${orgId}/invitations/${invitationId}`,
        });
        return res.data;
    },

    async acceptInvitation(token: string) {
        const res = await apiService.request({
            method: 'POST', url: `${BASE}/invitations/accept`,
            data: { token },
        });
        return res.data;
    },

    async getInvitationInfo(token: string) {
        const res = await apiService.request({
            method: 'GET', url: `${BASE}/invitations/info/${token}`,
        });
        return res.data;
    },

    // ── Departments ────────────────────────────────────────────────────

    async listDepartments(orgId: number) {
        const res = await apiService.request({ method: 'GET', url: `${BASE}/${orgId}/departments` });
        return res.data;
    },

    async createDepartment(orgId: number, name: string, description?: string, headId?: number) {
        const res = await apiService.request({
            method: 'POST', url: `${BASE}/${orgId}/departments`,
            data: { name, description, head_id: headId },
        });
        return res.data;
    },

    async updateDepartment(orgId: number, deptId: number, data: { name?: string; description?: string; head_id?: number }) {
        const res = await apiService.request({
            method: 'PUT', url: `${BASE}/${orgId}/departments/${deptId}`, data,
        });
        return res.data;
    },

    async deleteDepartment(orgId: number, deptId: number) {
        const res = await apiService.request({
            method: 'DELETE', url: `${BASE}/${orgId}/departments/${deptId}`,
        });
        return res.data;
    },

    // ── Audit Log ──────────────────────────────────────────────────────

    async getAuditLog(orgId: number, params?: { action?: string; actor_id?: number; limit?: number; offset?: number }) {
        const res = await apiService.request({ method: 'GET', url: `${BASE}/${orgId}/audit-log`, params });
        return res.data;
    },

    // ── Context Switch ─────────────────────────────────────────────────

    async switchOrg(orgId: number | null) {
        const res = await apiService.request({
            method: 'POST', url: '/auth/switch-org',
            data: { org_id: orgId },
        });
        return res.data;
    },
};

export default organizationService;
