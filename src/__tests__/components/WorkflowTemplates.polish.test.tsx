/**
 * Library gallery: opening a card shows a labelled deploy dialog,
 * grouped sections, and Deploy still submits the same id + config object.
 */
import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { GalleryTemplate } from '../../types';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    getTemplates: jest.fn(),
    getTemplateCategories: jest.fn(),
    getConnections: jest.fn(),
    useTemplate: jest.fn(),
  },
}));

jest.mock('../../lib/notify', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
}));

import apiService from '../../services/api';
import WorkflowTemplates from '../../components/WorkflowTemplates';

const rentTemplate: GalleryTemplate = {
  id: 'whatsapp_rent_collection_agent',
  name: 'Rent Collection',
  description: 'Collect rent on WhatsApp',
  category: 'Real Estate',
  icon: '🏠',
  difficulty: 'beginner',
  estimated_time: '10 min',
  tags: ['rent', 'whatsapp'],
  required_connections: ['whatsapp'],
  steps: [
    {
      step_number: 1,
      tool_name: 'whatsapp_send',
      tool_parameters: {},
      description: 'Greet the tenant',
    },
  ],
  variables: {
    business_name: {
      type: 'string',
      required: true,
      default: 'Acme Estates',
      description: 'Name shown to tenants',
    },
  },
};

const getTemplates = apiService.getTemplates as jest.Mock;
const getTemplateCategories = apiService.getTemplateCategories as jest.Mock;
const getConnections = apiService.getConnections as jest.Mock;
const useTemplate = apiService.useTemplate as jest.Mock;

async function openRentCard() {
  render(<WorkflowTemplates />);
  const card = await screen.findByRole('heading', { name: 'Rent Collection' });
  fireEvent.click(card);
  return screen.findByRole('dialog', { name: 'Rent Collection' });
}

describe('WorkflowTemplates library polish', () => {
  beforeEach(() => {
    getTemplates.mockResolvedValue({
      success: true,
      data: { templates: [rentTemplate] },
    });
    getTemplateCategories.mockResolvedValue({
      success: true,
      data: [{ id: 'real-estate', name: 'Real Estate', icon: '🏠', color: '#0f766e' }],
    });
    getConnections.mockResolvedValue({ success: true, data: [] });
    useTemplate.mockResolvedValue({ success: true });
  });

  it('shows the template name on a labelled deploy dialog', async () => {
    const dialog = await openRentCard();

    expect(dialog).toHaveAccessibleName('Rent Collection');
    expect(within(dialog).getByRole('heading', { name: 'Rent Collection', level: 2 })).toBeInTheDocument();
  });

  it('groups the deploy dialog into overview, connections, configuration, and tags', async () => {
    const dialog = await openRentCard();

    expect(within(dialog).getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Connections' })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Configuration' })).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: 'Tags' })).toBeInTheDocument();
    expect(within(dialog).getByText('Collect rent on WhatsApp')).toBeInTheDocument();
    expect(within(dialog).getByText('WhatsApp')).toBeInTheDocument();
  });

  it('deploys with the template id and the config object built from defaults', async () => {
    const dialog = await openRentCard();

    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: /^deploy$/i }));
      await Promise.resolve();
    });

    expect(useTemplate).toHaveBeenCalledTimes(1);
    expect(useTemplate).toHaveBeenCalledWith('whatsapp_rent_collection_agent', {
      business_name: 'Acme Estates',
    });
  });
});
