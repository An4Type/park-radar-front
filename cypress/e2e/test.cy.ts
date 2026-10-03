describe('Park Radar', () => {
  it('goes from search to a zone', () => {
    cy.visit('/');
    cy.contains('button', 'Where to?').click();
    cy.get('input[aria-label="Destination"]').type('Old Town');
    cy.contains('button', 'Old Town Hall').click();
    cy.contains('button', 'Navigate').should('be.visible');
  });
});
