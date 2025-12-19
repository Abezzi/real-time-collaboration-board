import { config } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import 'quasar/dist/quasar.css';
import iconSet from 'quasar/icon-set/mdi-v7';
import { Quasar } from 'quasar';

// Global Quasar plugins for tests
config.global.plugins = [[Quasar, { iconSet }]];

// Create Pinia for every test
config.global.plugins.push(createTestingPinia());

// Jest DOM matchers
import '@testing-library/jest-dom';
