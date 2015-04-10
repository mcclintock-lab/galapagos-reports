ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
d3 = window.d3

class OverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.overview
  dependencies:[ 
    'SizeStats'
  ]
  render: () ->
    names = {
              "mixed_use": "Mixed Use", 
              "sustainable_use": "Sustainable Use", 
              "non_extractive_use": 'Non Extractive Use', 
              "intangible": 'Intangible'
            }

    # create random data for visualization
    size_stats = sketch_habitats = @recordSet('SizeStats', 'SizeStats').toArray()
    isCollection = @model.isCollection()
    size_km = 0
    if !isCollection
      size_km = size_stats[0].TOTAL
    else
      for stat in size_stats
        stat.ZONE_TYPE = names[stat.ZONE_TYPE]
    # setup context object with data and render the template from it
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      isCollection: isCollection
      size_stats: size_stats
      size_km: size_km
    
    @$el.html @template.render(context, templates)




module.exports = OverviewTab