Feature: Searching for a barcode scanner app
  
  Scenario: Google search for barcode scanner app
    Given I am online at google.co.uk
    When I search Google for "barcode scanner app"
    Then I should see "Orca Scan" in the results

  Scenario: Google search for Orca Scan
    Given I am online at google.co.uk
    When I search Google for "Orca Scan"
    Then I should see "Orca Scan" in the results
