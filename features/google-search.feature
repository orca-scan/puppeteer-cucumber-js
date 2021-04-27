Feature: Searching for a barcode scanner app
  Scenario: Google search for Orca Scan
    Given I am online at "https://www.google.co.uk/"
    When I search Google for "Orca Scan"
    Then I should see "Orca Scan" in the results
    Then I should go back one page
    When I am online at "https://www.google.com/"
    When I search Google for "Orca Scan."
    Then I should see "Orca Scan" in the results
    Then I should go back one page
    When I am online at "https://www.google.co.uk/"
    When I search Google for "Barcode Tracking, Simplified"
    Then I should see "Orca Scan" in the results
    Then I should go back one page
    When I am online at "https://www.google.com/"
    When I search Google for "Barcode Tracking, Simplified."
    Then I should see "Orca Scan" in the results
