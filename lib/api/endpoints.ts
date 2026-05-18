export const endpoints = {
  auth: {
    register: '/auth/register',
    login:    '/auth/login',
    logout:   '/auth/logout',
    session:  '/auth/session',
  },
  assignments: {
    list:   '/assignments',
    create: '/assignments',
    get:    (id: string) => `/assignments/${id}`,
    update: (id: string) => `/assignments/${id}`,
    delete: (id: string) => `/assignments/${id}`,
  },
  submissions: {
    list:            '/submissions',
    create:          '/submissions',
    get:             (id: string) => `/submissions/${id}`,
    resubmitRequest: (id: string) => `/submissions/${id}/resubmit-request`,
  },
  evaluations: {
    list:     '/evaluations',
    get:      (id: string) => `/evaluations/${id}`,
    evaluate: '/evaluations/evaluate',
    batch:    '/evaluations/batch',
  },
  files: {
    upload: '/files/upload',
    get:    (id: string) => `/files/${id}`,
    parse:  '/files/parse',
  },
  health: '/health',
}
