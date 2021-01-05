Feature: Book and Orca Scan demo
  A user should be able to book a product demo
  
  Scenario: Book an Orca Scan demo
    Given I am on the Orca Scan barcode tracking website
    When I click the Book a demo button
    Then I should be able to book a demo