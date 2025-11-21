-- Create trigger to increment karma when booking is completed
CREATE TRIGGER trigger_increment_karma_on_booking_complete
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed')
  EXECUTE FUNCTION public.increment_karma_on_booking_complete();