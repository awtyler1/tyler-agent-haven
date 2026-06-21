TIG Forms — PDF drop folder
============================

Put form PDFs here. Files in this folder are served at /forms/<filename>.
For example, public/forms/scope-of-appointment.pdf is reached at
  https://www.tigagenthub.com/forms/scope-of-appointment.pdf

To make a form downloadable on the Forms page:
  1) Drop the PDF in this folder.
  2) In src/data/formsContent.ts, set that form's `file` to its path,
     e.g.  file: '/forms/scope-of-appointment.pdf'

Until `file` is set, the form shows "Coming soon" on the page.

Planned filenames for the first batch:
  - scope-of-appointment.pdf        (Scope of Appointment)
  - cms-40b-part-b-application.pdf   (CMS-40B: Apply for Part B)
  - tpmo-disclaimer.pdf             (TPMO Disclaimer)
